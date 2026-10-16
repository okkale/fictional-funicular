// K.A.L.E.'s voice. Fixed lines play pre-recorded neural audio (public/kale/voice, made by
// slm/record_voice.py); anything else uses the browser's Web Speech voice. Everything degrades to
// a silent no-op where the browser lacks support (Firefox has no SpeechRecognition).
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

// Fallback browser voice, for lines without a recording: a casual male voice like the recorded
// one (Liam, Canadian). Preference order: Canadian, then natural (neural) US, then Indian English
// male voices, then any male English voice. Names differ per OS and browser, so match by name.
const PREFER = [
  [/Liam/i], // Microsoft Liam, en-CA
  [/Brian|Andrew|Guy|Davis|Christopher|Eric/i], // Microsoft neural, male (Edge)
  [/Prabhat/i], // Microsoft Prabhat Online (Natural), en-IN
  [/Rishi/i], // Apple, en-IN
  [/Google US English|Google UK English Male/i],
  [/Ravi/i], // Microsoft Ravi, en-IN, Windows desktop
  [/Daniel|Alex|Aaron|Fred/i], // Apple
  [/David|George|Mark/i], // Microsoft desktop, male
  [/male|man/i],
];
let voices = [];
if ("speechSynthesis" in w) {
  const load = () => (voices = speechSynthesis.getVoices());
  load();
  speechSynthesis.addEventListener?.("voiceschanged", load);
}

function pickVoice() {
  const list = voices.length ? voices : speechSynthesis.getVoices();
  const english = list.filter((v) => /^en/i.test(v.lang));
  for (const [name, lang = /./] of PREFER) {
    const v = english.find((x) => name.test(x.name) && lang.test(x.lang));
    if (v) return v;
  }
  return null;
}

// Recorded lines: { [text]: file }, fetched once.
let recordings = null;
const manifest = () =>
  (recordings ??= fetch("/kale/voice/index.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m) => (typeof m === "object" && m ? m : {})));
if (typeof window !== "undefined") manifest();

let audio = null;
let ctx = null;
let speechId = 0;

// Drive `level` from the recording's real loudness.
function meter(el) {
  try {
    ctx ??= new (w.AudioContext || w.webkitAudioContext)();
    ctx.resume?.();
    // A suspended context would swallow the sound, so only route through it once it's running.
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

function playRecording(file, id, { onStart, onEnd }) {
  return new Promise((resolve) => {
    const el = new Audio(`/kale/voice/${file}`);
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

function speakBrowser(text, { onStart, onEnd }) {
  if (!("speechSynthesis" in w)) return (onEnd?.(), Promise.resolve());
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    // A touch slower and lower than the default reads as someone talking, not announcing.
    u.rate = 0.96;
    u.pitch = 0.95;
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || "en-IN";
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
export async function speak(text, handlers = {}) {
  if (!supported.tts) return;
  stopSpeaking();
  const id = ++speechId;
  const file = (await manifest())[text];
  if (id !== speechId) return;
  if (file && (await playRecording(file, id, handlers))) return;
  if (id !== speechId) return;
  return speakBrowser(text, handlers);
}

export function stopSpeaking() {
  speechId++;
  if (audio) {
    const el = audio;
    audio = null;
    el.onpause = null;
    el.pause();
    el.onended?.(); // settle its promise and handlers
  }
  if ("speechSynthesis" in w) speechSynthesis.cancel();
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
