import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { LAYERS } from "./hudLayers";
import { level } from "./voice";

/*
  Canvas compositor for the K.A.L.E. HUD. Fills its parent (square), DPR-aware.
  compact: dock size, skips the decorative full-only layers.
  boot: when true, layers draw on over `bootMs`; otherwise the HUD appears fully drawn.
  tint: "idle" | "listening" | "speaking".
*/
export default function Orb({ compact = false, boot = false, bootMs = 2600, tint = "idle", className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const tintRef = useRef(tint);
  tintRef.current = tint;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const layers = compact ? LAYERS.filter((l) => !l.full) : LAYERS;
    let raf = 0;
    let visible = true;
    let w = 0;
    const t0 = performance.now();

    const resize = () => {
      // offsetWidth ignores CSS transforms (the dock scales in), unlike getBoundingClientRect.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now) => {
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
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [compact, boot, bootMs, reduce]);

  return <canvas ref={ref} className={`aspect-square w-full ${className}`} aria-hidden />;
}
