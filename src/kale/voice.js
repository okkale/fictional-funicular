// Kyle's voice engine. Supports both Female (default) and Male AI voices.
// Fixed lines play pre-recorded neural audio (public/kale/voice/female and public/kale/voice);
// dynamic/learned responses use the browser's Web Speech API with gender-matched voice models.
import { speakable } from "./speakable";

const w = typeof window === "undefined" ? {} : window;
const SR = w.SpeechRecognition || w.webkitSpeechRecognition;

export const supported = {
  tts: "speechSynthesis" in w || "Audio" in w,
  stt: !!SR,
};

// Voice output level, 0..1, read every frame by the HUD canvas (no React re-render).
export const level = { value: 0 };

let pulse = null;

// Active voice gender: defaults to "female" per user specification
let activeGender = (typeof localStorage !== "undefined" && localStorage.getItem("kale_voice_gender")) || "female";

export function getVoiceGender() {
  return activeGender;
}

export function setVoiceGender(gender) {
  activeGender = gender === "male" ? "male" : "female";
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("kale_voice_gender", activeGender);
    } catch {}
  }
  return activeGender;
}

// Fallback browser voice preferences:
// Female voice preference list (default):
const PREFER_FEMALE = [
  [/Jenny|Aria|Clara|Ava|Emma/i], // Microsoft natural neural female (Edge/Windows)
  [/Google US English|Google US English Female|Google UK English Female/i],
  [/Neerja/i], // Microsoft Neerja (Natural), en-IN
  [/Samantha|Victoria|Karen|Moira|Tessa|Fiona/i], // Apple macOS / iOS
  [/Heera|Veena/i], // Apple / Microsoft en-IN
  [/Zira/i], // Windows desktop female
  [/female|woman/i],
];

// Male voice preference list:
const PREFER_MALE = [
  [/Liam/i], // Microsoft Liam, en-CA
  [/David/i], // Microsoft David, Windows desktop male
  [/Mark|George/i], // Microsoft desktop male
  [/Brian|Andrew|Guy|Davis|Christopher|Eric/i], // Microsoft neural, male (Edge)
  [/Prabhat/i], // Microsoft Prabhat Online (Natural), en-IN
  [/Rishi/i], // Apple, en-IN
  [/Google UK English Male/i], // Google Chrome male
  [/Ravi/i], // Microsoft Ravi, en-IN, Windows desktop
  [/Daniel|Alex|Aaron|Fred/i], // Apple male
  [/ male | man |Natural.*Male|Desktop.*Male/i],
];

let voices = [];
if (supported.tts && "speechSynthesis" in w) {
  const load = () => (voices = speechSynthesis.getVoices());
  load();
  speechSynthesis.addEventListener?.("voiceschanged", load);
}

function pickVoice(gender = activeGender) {
  const list = voices.length ? voices : ("speechSynthesis" in w ? speechSynthesis.getVoices() : []);
  const english = list.filter((v) => /^en/i.test(v.lang));
  const prefs = gender === "male" ? PREFER_MALE : PREFER_FEMALE;
  for (const [name, lang = /./] of prefs) {
    const v = english.find((x) => name.test(x.name) && lang.test(x.lang));
    if (v) return v;
  }
  const tag = gender === "male" ? /male/i : /female/i;
  const byTag = english.find((x) => tag.test(x.name));
  if (byTag) return byTag;

  if (gender === "male") {
    // Specifically exclude any female voices when male voice is selected
    const strictlyMale = english.find((x) => !/female|woman|zira|jenny|aria|samantha|victoria|karen|heera|veena|catherine|linda|susan/i.test(x.name));
    if (strictlyMale) return strictlyMale;
  } else {
    const strictlyFemale = english.find((x) => /female|woman|zira|jenny|aria|samantha|victoria|karen|heera|veena|catherine|linda|susan/i.test(x.name));
    if (strictlyFemale) return strictlyFemale;
  }

  return english[0] || list[0] || null;
}

// Recorded lines per voice:
const manifests = { female: null, male: null };
const manifest = (gender = activeGender) => {
  const g = gender === "male" ? "male" : "female";
  if (manifests[g]) return manifests[g];
  const url = g === "female" ? "/kale/voice/female/index.json" : "/kale/voice/index.json";
  return (manifests[g] = fetch(url)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m) => (typeof m === "object" && m ? m : {})));
};
if (typeof window !== "undefined") {
  manifest("female");
  manifest("male");
}

let audio = null;
let ctx = null;
let speechId = 0;

// Drive `level` from the recording's real loudness.
function meter(el) {
  try {
    ctx ??= new (w.AudioContext || w.webkitAudioContext)();
    ctx.resume?.();
    if (ctx.state !== "running") throw new Error("audio context not running");
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaElementSource(el).connect(analyser);
    analyser.connect(ctx.destination);
    const buf = new Uint8Array(analyser.fftSize);
    return () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      level.value = Math.min(1, Math.sqrt(sum / buf.length) * 5);
    };
  } catch {
    return () => (level.value = Math.max(level.value * 0.82, 0.25 + Math.random() * 0.45));
  }
}

function playRecording(file, id, { onStart, onEnd }, gender = activeGender) {
  return new Promise((resolve) => {
    const prefix = gender === "female" ? "/kale/voice/female/" : "/kale/voice/";
    const el = new Audio(`${prefix}${file}`);
    audio = el;
    let tick = null;
    const done = (ok) => {
      clearInterval(tick);
      level.value = 0;
      if (audio === el) audio = null;
      resolve(ok);
    };
    el.onplaying = () => {
      if (id !== speechId) return el.pause();
      if (tick) return; // resumed after buffering
      onStart?.();
      const read = meter(el);
      clearInterval(pulse);
      tick = pulse = setInterval(read, 50);
    };
    el.onended = () => (onEnd?.(), done(true));
    el.onerror = () => done(false); // missing file: fall back to the browser voice
    el.onpause = () => {
      if (!el.ended) (onEnd?.(), done(true));
    };
    el.play().catch(() => done(false));
  });
}

function speakBrowser(text, { onStart, onEnd }, gender = activeGender) {
  if (!("speechSynthesis" in w)) return (onEnd?.(), Promise.resolve());
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    const isFemale = gender === "female";
    u.rate = isFemale ? 1.0 : 0.96;
    u.pitch = isFemale ? 1.04 : 0.95;
    const v = pickVoice(gender);
    if (v) u.voice = v;
    u.lang = v?.lang || (isFemale ? "en-US" : "en-IN");
    const done = () => {
      clearInterval(pulse);
      level.value = 0;
      onEnd?.();
      resolve();
    };
    u.onstart = () => {
      onStart?.();
      // Syllable-like flicker between word boundaries keeps the waveform alive.
      clearInterval(pulse);
      pulse = setInterval(() => { level.value = Math.max(level.value * 0.82, 0.25 + Math.random() * 0.45); }, 70);
    };
    u.onboundary = () => { level.value = 1; };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  });
}

// Speak a line. Resolves when finished (or immediately when unsupported).
export async function speak(text, handlers = {}, gender = activeGender) {
  if (!supported.tts) return;
  stopSpeaking();
  const id = ++speechId;
  const m = await manifest(gender);
  const file = m?.[text];
  if (id !== speechId) return;
  if (file && (await playRecording(file, id, handlers, gender))) return;
  if (id !== speechId) return;
  return speakBrowser(text, handlers, gender);
}

export function stopSpeaking() {
  speechId++;
  if (audio) {
    const el = audio;
    audio = null;
    el.onpause = null;
    el.pause();
    el.onended?.();
  }
  if (supported.tts && "speechSynthesis" in w) speechSynthesis.cancel();
  clearInterval(pulse);
  level.value = 0;
}

// Listen for one utterance. Returns a stop function.
export function listen(onText, onEnd) {
  if (!SR) return () => {};
  const r = new SR();
  r.lang = "en-IN";
  r.interimResults = false;
  r.onresult = (e) => onText(e.results[0][0].transcript);
  r.onend = () => onEnd?.();
  r.onerror = () => onEnd?.();
  r.start();
  return () => r.stop();
}
