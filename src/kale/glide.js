import { still } from "../perf";

// One scroll animator for the whole site (landing snap, tours, Kyle answers, proof chips).
// Runs on the wall clock, not on frame deltas, so a slow frame skips ahead instead of stuttering,
// and it always lands exactly on its target. One glide at a time: a new one replaces the old.

const reduce = () => still;
const EASES = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), // jumps between places
  pan: (x) => -(Math.cos(Math.PI * x) - 1) / 2, // gentle sine: a slow camera pan through a section
};
const set = (v) => window.scrollTo({ top: v, behavior: "instant" });

let active = null; // { raf, to, cancelable }

export const isGliding = () => !!active;
export const glideTarget = () => active?.to ?? null;

export function stopGlide() {
  if (!active) return;
  cancelAnimationFrame(active.raf);
  active = null;
}

// Duration grows with distance but stays inside 1.1-2.1s: unhurried hops, calm long jumps.
const durationFor = (d) => Math.min(2100, Math.max(1100, 800 + Math.sqrt(Math.abs(d)) * 20));

export function glideTo(to, { ms, cancelable = true, ease = "inOut" } = {}) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  to = Math.max(0, Math.min(Math.round(to), max));
  stopGlide();
  if (wheel.raf) {
    cancelAnimationFrame(wheel.raf);
    wheel.raf = 0;
  }
  const from = window.scrollY;
  if (reduce() || Math.abs(to - from) < 2) {
    set(to);
    return;
  }
  const dur = ms ?? durationFor(to - from);
  const t0 = performance.now();
  const g = { raf: 0, to, cancelable };
  const curve = EASES[ease] || EASES.inOut;
  const step = (now) => {
    if (active !== g) return;
    const x = Math.min(1, (now - t0) / dur);
    set(from + (to - from) * curve(x));
    if (x < 1) g.raf = requestAnimationFrame(step);
    else {
      set(to);
      active = null;
    }
  };
  active = g;
  g.raf = requestAnimationFrame(step);
}

// Where a section's content starts: its top plus its own top padding, minus a small margin, so a
// scroll lands on the first line of content instead of on empty padding. (The nav hides while
// scrolling down and during tours, so no room is reserved for it.)
const MARGIN = 24;
export function sectionY(selector) {
  if (selector === "#top") return 0;
  const el = document.querySelector(selector);
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  if (selector === "#hero") return top; // page 2 is one screen tall: land flush on it
  const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
  return Math.max(0, top + pad - MARGIN);
}

// Smooth wheel. A mouse wheel moves ~100px per notch, which reads as stutter. Each notch instead
// moves a target and the page eases toward it (frame-rate independent exponential smoothing), the
// way trackpads already feel. Touch, keyboard and scrollbar keep native scrolling. Nested
// scrollable areas (chat log, tab strips) keep their own wheel. The landing snap listens in the
// capture phase and calls preventDefault first, so it always wins on page 1.
const wheel = { target: 0, raf: 0, last: 0 };
const TAU = 0.14; // seconds to cover ~63% of the remaining distance (wheel glide)

function scrollableAncestor(node, dy) {
  for (let el = node; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    if (!(el instanceof Element)) continue;
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
      if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return el;
    }
  }
  return null;
}

function wheelStep(now) {
  const dt = Math.min(0.05, (now - wheel.last) / 1000);
  wheel.last = now;
  const y = window.scrollY;
  const diff = wheel.target - y;
  if (Math.abs(diff) < 0.5) {
    set(wheel.target);
    wheel.raf = 0;
    return;
  }
  // At least 1px per frame: browsers may round scroll positions, which could stall the last pixel.
  let step = diff * (1 - Math.exp(-dt / TAU));
  if (Math.abs(step) < 1) step = Math.sign(diff) * Math.min(1, Math.abs(diff));
  set(y + step);
  wheel.raf = requestAnimationFrame(wheelStep);
}

function onWheel(e) {
  if (e.defaultPrevented || e.ctrlKey || reduce()) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal: let strips scroll natively
  const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
  if (scrollableAncestor(e.target, dy)) return;
  e.preventDefault();
  if (active) {
    if (!active.cancelable) return; // a locked hand-off is running
    stopGlide(); // the visitor's own scrolling always wins over a cancelable glide
  }
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const base = wheel.raf ? wheel.target : window.scrollY; // resync after keyboard / scrollbar use
  // Coming up from page 2, stop at its top edge: only the landing snap crosses that seam.
  const seam = document.querySelector("#hero") ? sectionY("#hero") : 0;
  const floor = window.scrollY >= seam - 2 ? seam : 0;
  wheel.target = Math.round(Math.max(floor, Math.min(max, base + dy)));
  if (!wheel.raf) {
    wheel.last = performance.now();
    wheel.raf = requestAnimationFrame(wheelStep);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", () => active?.cancelable && stopGlide(), { passive: true, capture: true });
}
