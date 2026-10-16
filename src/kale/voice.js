// Web Speech API wrapper for K.A.L.E. Everything degrades to a silent no-op where the browser
// lacks support (Firefox has no SpeechRecognition; some browsers lack speechSynthesis).

const w = typeof window === "undefined" ? {} : window;
const SR = w.SpeechRecognition || w.webkitSpeechRecognition;

export const supported = {
  tts: "speechSynthesis" in w,
  stt: !!SR,
};

// Voice output level, 0..1, read every frame by the HUD canvas (no React re-render).
export const level = { value: 0 };

let pulse = null;

// K.A.L.E. speaks with a female voice. Preference order: natural (neural) voices first, then
// Indian, British and US English. Voice names differ per OS and browser, so match by name.
const FEMALE = [
  /Neerja/i, // Microsoft Neerja (en-IN, neural)
  /Sonia|Libby|Maisie/i, // Microsoft en-GB neural
  /Aria|Jenny|Michelle|Ava|Emma/i, // Microsoft en-US neural
  /Google UK English Female/i,
  /Heera/i, // Microsoft Heera (en-IN)
  /Hazel|Susan/i, // Microsoft en-GB
  /Zira/i, // Microsoft en-US
  /Samantha|Karen|Moira|Tessa|Veena|Serena|Kate|Fiona/i, // Apple
  /Google US English/i, // Chrome's default US voice is female
  /female|woman/i,
];
let voices = [];
if (supported.tts) {
  const load = () => (voices = speechSynthesis.getVoices());
  load();
  speechSynthesis.addEventListener?.("voiceschanged", load);
}

function pickVoice() {
  const list = voices.length ? voices : speechSynthesis.getVoices();
  const english = list.filter((v) => /^en/i.test(v.lang));
  for (const re of FEMALE) {
    const v = english.find((x) => re.test(x.name)) || list.find((x) => re.test(x.name) && /^en/i.test(x.lang));
    if (v) return v;
  }
  return null;
}

// Speak a line. Resolves when finished (or immediately when unsupported).
export function speak(text, { onStart, onEnd } = {}) {
  if (!supported.tts) return Promise.resolve();
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.05;
    const v = pickVoice();
    if (v) u.voice = v;
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

export function stopSpeaking() {
  if (supported.tts) speechSynthesis.cancel();
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
