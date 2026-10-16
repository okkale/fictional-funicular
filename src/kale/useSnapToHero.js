import { useEffect } from "react";
import { glideTarget, glideTo, isGliding, sectionY } from "./glide";

/*
  One gesture moves between the landing and page 2. A wheel tick, a swipe or a key press on the
  landing glides the page to #hero with a soft ease-in-out; the same gesture upward at the
  top of #hero glides back. The glide is interruptible: reversing mid-flight re-targets from the
  live scroll position, so the page never has to finish one move before starting the other.
  The glide itself lives in glide.js (wall-clock timed, lands exactly on the seam).
  Listens to wheel / touch / key intent (never to `scroll`). Reduced motion jumps instantly.
*/
export function useSnapToHero({ reduce = false } = {}) {
  useEffect(() => {
    let snapping = false; // true while one of our own glides runs
    const heroTop = () => sectionY("#hero") ?? window.innerHeight;
    const go = (to) => {
      if (snapping && glideTarget() === to) return;
      snapping = true;
      // Not cancelable: trackpad momentum after the gesture must not stop the hand-off midway.
      glideTo(to, { ms: reduce ? 0 : 1700, cancelable: false });
      const settle = () => (isGliding() ? requestAnimationFrame(settle) : (snapping = false));
      requestAnimationFrame(settle);
    };

    // Where the page is relative to the landing → hero seam.
    const zone = () => {
      const h = heroTop();
      const y = window.scrollY;
      if (y < h - 2) return "landing";
      if (y <= h + 2) return "seam";
      return "below";
    };

    // Returns true when the gesture was taken over.
    const intent = (dir) => {
      if (!dir) return false;
      if (snapping) {
        go(dir > 0 ? heroTop() : 0); // reversing mid-flight re-targets from the live position
        return true;
      }
      const z = zone();
      if (z === "landing") {
        go(dir > 0 ? heroTop() : 0);
        return true;
      }
      if (z === "seam" && dir < 0) {
        go(0);
        return true;
      }
      return false;
    };

    const onWheel = (e) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 1) return;
      if (intent(Math.sign(e.deltaY))) e.preventDefault();
    };

    let startY = null;
    const onTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (startY == null) return;
      const dy = startY - e.touches[0].clientY;
      if (Math.abs(dy) < 10) return; // hysteresis before committing to a direction
      if (intent(Math.sign(dy))) {
        e.preventDefault();
        startY = null;
      }
    };

    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const dir = ["ArrowDown", "PageDown", " "].includes(e.key) ? (e.shiftKey && e.key === " " ? -1 : 1) : ["ArrowUp", "PageUp"].includes(e.key) ? -1 : 0;
      if (intent(dir)) e.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true }); // before smooth wheel
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduce]);
}
