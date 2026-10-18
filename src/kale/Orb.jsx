import { useEffect, useRef } from "react";
import { useReducedMotion } from "../perf";
import { LAYERS } from "./hudLayers";
import { level } from "./voice";
import { onLiteChange, perf } from "../perf";

/*
  Canvas compositor for the Kyle HUD. Fills its parent (square), DPR-aware.
  compact: dock size, skips the decorative full-only layers.
  boot: when true, layers draw on over `bootMs`; otherwise the HUD appears fully drawn.
  tint: "idle" | "listening" | "speaking".
  Lite mode (src/perf.js): same look at 1x resolution, half-radius glow and 30 fps.
*/
export default function Orb({ compact = false, boot = false, bootMs = 2600, tint = "idle", className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const tintRef = useRef(tint);
  tintRef.current = tint;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    // Shadow blur is the costliest thing a 2D canvas does; lite mode halves every layer's radius.
    const blur = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "shadowBlur");
    Object.defineProperty(ctx, "shadowBlur", { get: () => blur.get.call(ctx), set: (v) => blur.set.call(ctx, perf.lite ? v / 2 : v), configurable: true });
    const layers = compact ? LAYERS.filter((l) => !l.full) : LAYERS;
    let raf = 0;
    let visible = true;
    let w = 0;
    let last = 0;
    const t0 = performance.now();

    const resize = () => {
      // offsetWidth ignores CSS transforms (the dock scales in), unlike getBoundingClientRect.
      const dpr = perf.lite ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now) => {
      if (perf.lite && !reduce && now - last < 30) {
        if (visible) raf = requestAnimationFrame(frame);
        return;
      }
      last = now;
      const t = (now - t0) / 1000;
      const progress = boot && !reduce ? Math.min(1, (now - t0) / bootMs) : 1;
      const R = w / 2;
      ctx.clearRect(0, 0, w, w);
      ctx.save();
      ctx.translate(R, R);
      ctx.globalCompositeOperation = "lighter";
      const s = { level: level.value, tint: tintRef.current };
      for (const l of layers) {
        const p = Math.min(1, Math.max(0, (progress - l.start) / 0.45));
        if (p > 0) l.draw(ctx, reduce ? 0 : t, R * 0.98, p, s);
      }
      ctx.restore();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const stopLite = onLiteChange(resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stopLite();
    };
  }, [compact, boot, bootMs, reduce]);

  return <canvas ref={ref} className={`aspect-square w-full ${className}`} aria-hidden />;
}
