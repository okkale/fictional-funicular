import { useSyncExternalStore } from "react";

// Lite mode for low-end machines. Decided once at startup from hardware hints, and switched on
// later if the sphere can't hold a frame rate. `?lite` / `?full` in the URL force either mode.
// Lite keeps the same look and the same animations; it only renders them cheaper. While on, <html>
// carries the `lite` class (CSS swaps backdrop and filter blurs for flat fills) and the canvases
// drop resolution and cap their frame rate.

const listeners = new Set();

function detect() {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  if (q.has("full")) return false;
  if (q.has("lite")) return true;
  const nav = window.navigator;
  if (nav.connection?.saveData) return true;
  if (nav.deviceMemory && nav.deviceMemory <= 4) return true;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
  return false;
}

const forced = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("full");

export const perf = { lite: detect() };

function apply() {
  if (typeof document !== "undefined") document.documentElement.classList.toggle("lite", perf.lite);
}
apply();

export function setLite(on) {
  if (perf.lite === on || (on && forced)) return;
  perf.lite = on;
  apply();
  listeners.forEach((fn) => fn(on));
}

export function onLiteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// A desktop with 8+ threads and 8+ GB (or memory unknown) always gets full quality: a dip there
// is a busy moment (boot, a background window, another app), not a weak machine.
const strong = () => {
  const nav = window.navigator;
  return !window.matchMedia("(pointer: coarse)").matches && nav.hardwareConcurrency >= 8 && !(nav.deviceMemory < 8);
};

// Watches frame times; calls setLite(true) only when the average stays below ~30 fps for three
// seconds running, with the page in front. Never on strong machines.
export function fpsGuard() {
  if (typeof window === "undefined" || strong()) return () => {};
  const armedAt = performance.now() + 3500; // let the boot finish: shader compile and layout spikes
  let frames = 0;
  let total = 0;
  let slow = 0;
  return (dtMs) => {
    if (perf.lite || performance.now() < armedAt) return;
    if (document.hidden || !document.hasFocus() || dtMs > 250) return; // throttled or paused, not slow
    frames++;
    total += dtMs;
    if (frames >= 60) {
      slow = total / frames > 34 ? slow + 1 : 0;
      if (slow >= 3) setLite(true);
      frames = 0;
      total = 0;
    }
  };
}

// React hook: true while lite mode is on.
export function useLite() {
  return useSyncExternalStore(onLiteChange, () => perf.lite, () => false);
}

// Motion policy. The site keeps its transitions even when the OS asks for reduced motion: low-end
// Windows setups switch "animation effects" off for speed, which would otherwise turn every glide
// and the landing hand-off into jumps. `?still` in the URL turns motion off for visitors who want that.
export const still = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("still");
if (still && typeof document !== "undefined") document.documentElement.classList.add("still");
export const useReducedMotion = () => still;
