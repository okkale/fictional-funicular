// Shared K.A.L.E. state: chat log, voice, tour. One store so the landing greeter and the
// corner dock speak with the same voice and the same memory.
import { useSyncExternalStore } from "react";
import { profile } from "../data";
<<<<<<< Updated upstream
import { answer, TOURS } from "./intents";
import { speak, stopSpeaking, supported } from "./voice";
=======
import { answer, matchIntent, TOURS } from "./intents";
import { speak, stopSpeaking, supported, getVoiceGender, setVoiceGender as applyVoiceGender } from "./voice";
import { loadModel, pickAnswer, vet } from "./slm";
>>>>>>> Stashed changes
import { glideTo, isGliding, sectionY, stopGlide } from "./glide";
import { recordInteraction, findLearnedAnswer, alterAnswer, getMemoryStats, clearMemory, toggleLearning } from "./memory";

let state = {
  voiceOn: supported.tts,
  voiceGender: getVoiceGender(), // "female" by default
  speaking: false,
  listening: false,
  open: false,
  tour: null, // { id, index, playing } while a guided tour runs
  log: [],
};
const subs = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};

export function useKale() {
  return useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state);
}
export const kale = { get: () => state, set };

// Perform an intent action in the page.
export function runAction(action) {
  if (!action) return;
  if (action.type === "scroll") {
    const y = sectionY(action.target);
    if (y != null) glideTo(y);
    if (action.tab) window.dispatchEvent(new CustomEvent("kale:tab", { detail: action.tab }));
  } else if (action.type === "download") {
    const a = document.createElement("a");
    a.href = profile.resume;
    a.download = "";
    a.click();
  } else if (action.type === "open") {
    window.open(action.target, "_blank", "noopener");
  }
}

// Say a line: log it and, if voice is on, speak it. Resolves when spoken.
export function say(text, meta = null) {
  set({ log: [...state.log, { who: "ai", text, meta }] });
  if (!state.voiceOn) return Promise.resolve();
  return speak(text, { onStart: () => set({ speaking: true }), onEnd: () => set({ speaking: false }) }, state.voiceGender);
}

<<<<<<< Updated upstream
export function ask(raw) {
  const a = answer(raw);
  if (!a) return;
  set({ log: [...state.log, { who: "you", text: raw.trim() }] });
=======
// Start fetching the model's weights (about 1.7 MB) before the first question needs them.
export function warmModel() {
  if (state.slm !== "idle") return loadModel();
  set({ slm: "loading" });
  return loadModel().then((m) => (set({ slm: m ? "ready" : "off" }), m));
}

// The model answers when it is confident and its answer passes `vet`; otherwise, or while the
// weights are still downloading, the keyword rules answer.
async function modelAnswer(q) {
  const model = await Promise.race([warmModel(), wait(1500).then(() => null)]);
  if (!model) return null;
  return vet(await model.generate(q));
}

export async function ask(raw) {
  const q = raw.trim();
  if (!q) return;
  recordInteraction("you", q);
  set({ log: [...state.log, { who: "you", text: q }], thinking: true });

  // 1. Check self-learned memory & conversational context first
  const learned = findLearnedAnswer(q);
  if (learned) {
    set({ thinking: false });
    recordInteraction("ai", learned.text);
    runAction(learned.action);
    say(learned.text, { source: learned.source || "memory", rawQuestion: q });
    return;
  }

  // 2. Query on-device SLM
  let model = null;
  const t0 = performance.now();
  try {
    model = await modelAnswer(q);
  } catch {
    model = null;
  }
  const latencyMs = Math.round(performance.now() - t0);

  // 3. Match against intent rules with check
  const a = pickAnswer(model, matchIntent(q)) ?? answer(q);
  set({ thinking: false });
  recordInteraction("ai", a.text);
>>>>>>> Stashed changes
  runAction(a.action);
  say(a.text, {
    source: a.source || (model ? "slm" : "intent"),
    confidence: model?.confidence,
    latencyMs,
    action: a.action,
    rawQuestion: q,
  });
}

export { alterAnswer, clearMemory, getMemoryStats, toggleLearning };

export function setVoice(on) {
  if (!on) stopSpeaking();
  set({ voiceOn: on, speaking: false });
}

export function setVoiceGender(gender) {
  const g = applyVoiceGender(gender);
  set({ voiceGender: g });
  return g;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Resolves once the current glide has landed (or after 2.4s at most).
const landed = () =>
  new Promise((resolve) => {
    const t0 = performance.now();
    const check = () => (!isGliding() || performance.now() - t0 > 2400 ? resolve() : requestAnimationFrame(check));
    requestAnimationFrame(check);
  });
let tourToken = 0;

// Show stop `index` of the running tour; when playing, advance after the narration plus a hold.
async function goStep(index) {
  const t = state.tour;
  if (!t) return;
  const steps = TOURS[t.id];
  if (index < 0) index = 0;
  if (index >= steps.length) {
    stopTour(); // end quietly: the caption simply slides away
    return;
  }
  const token = ++tourToken;
  stopSpeaking();
  const step = steps[index];
  set({ tour: { ...t, index }, speaking: false });
  // Frame the stop: a section that fits between the screen top and the tour bar is centred in
  // that space; a taller one lands on its first line and then pans (below).
  const y = stopY(step);
  if (y != null) glideTo(y);
  if (step.tab) window.dispatchEvent(new CustomEvent("kale:tab", { detail: step.tab }));
  await landed();
  if (token !== tourToken) return;
  const spoken = say(step.line);
  // Sections taller than the visible area get a slow pan to their end while K.A.L.E. talks,
  // so every part of the section passes through view before the next stop.
  const pan = panFor(step.target, step.through);
  const hold = Math.max(6500, step.line.length * 65, pan ? pan.distance * 7 + 2800 : 0);
  if (pan) {
    await wait(1400); // let the headline register first
    if (token !== tourToken) return;
    glideTo(pan.to, { ms: hold - 2400, ease: "pan" });
  }
  await Promise.all([spoken, wait(pan ? hold - 1400 : hold)]);
  if (token !== tourToken || !state.tour?.playing) return;
  goStep(index + 1);
}

function contentBox(selector, through) {
  const first = document.querySelector(selector);
  const last = document.querySelector(through || selector);
  if (!first || !last) return null;
  const top = first.getBoundingClientRect().top + window.scrollY + (parseFloat(getComputedStyle(first).paddingTop) || 0);
  const bottom = last.getBoundingClientRect().bottom + window.scrollY - (parseFloat(getComputedStyle(last).paddingBottom) || 0);
  return { top, bottom };
}
const barReserve = () => {
  const el = document.querySelector("[data-tour-bar]");
  return el ? window.innerHeight - el.getBoundingClientRect().top + 12 : 132;
};

function stopY(step) {
  if (step.target === "#hero" || step.target === "#top") return sectionY(step.target);
  const box = contentBox(step.target, step.through);
  if (!box) return null;
  const visible = window.innerHeight - barReserve() - 24;
  const h = box.bottom - box.top;
  if (h <= visible) return box.top - 24 - (visible - h) / 2; // centred, equal room above and below
  return box.top - 24; // first line just below the top; the pan shows the rest
}

// How far to pan so a section's content (or the content of `through`) ends just above the tour
// bar, capped at two screens.
function panFor(selector, through) {
  if (selector === "#hero" || selector === "#top") return null;
  const el = document.querySelector(through || selector);
  if (!el) return null;
  const visible = window.innerHeight - barReserve();
  const bottom = el.getBoundingClientRect().bottom + window.scrollY;
  const pad = parseFloat(getComputedStyle(el).paddingBottom) || 0;
  const to = bottom - pad - visible; // content ends right above the bar: no empty band
  const distance = Math.min(to - window.scrollY, window.innerHeight * 2);
  return distance > 40 ? { to: window.scrollY + distance, distance } : null;
}

export function startTour(id) {
  if (!TOURS[id]) return;
  set({ tour: { id, index: 0, playing: true }, open: false });
  goStep(0);
}

export const nextStep = () => state.tour && goStep(state.tour.index + 1);
export const prevStep = () => state.tour && goStep(state.tour.index - 1);

export function togglePlay() {
  const t = state.tour;
  if (!t) return;
  if (t.playing) {
    tourToken++; // cancels the pending auto-advance
    stopGlide(); // and any pan in progress
    set({ tour: { ...t, playing: false } });
  } else {
    set({ tour: { ...t, playing: true } });
    goStep(t.index + 1);
  }
}

export function stopTour() {
  tourToken++;
  stopGlide();
  stopSpeaking();
  set({ tour: null, speaking: false });
}
