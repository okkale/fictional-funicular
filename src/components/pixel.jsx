import { useEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { themeColors } from "../colors";

// Dissolve block mix, as theme slots: mostly background, some accent, a little text and shadow.
const SLOTS = [["bg", 0.5], ["accent", 0.2], ["text", 0.12], ["surface2", 0.12], ["accentDeep", 0.06]];
function pickSlot() {
  let r = Math.random();
  for (const [c, w] of SLOTS) if ((r -= w) <= 0) return c;
  return "bg";
}

/*
  A grid of blocks that "denoises" away as progress goes 0 -> 1, like an image
  resolving out of a diffusion model. Drive it with a MotionValue (scroll) or let it auto-play.
*/
export function PixelField({ progress, cell = 34, className = "", mode = "dissolve", onDone }) {
  const ref = useRef(null);
  const cells = useRef([]);
  const dims = useRef({ cols: 0, rows: 0, w: 0, h: 0 });
  const reduce = useReducedMotion();

  const draw = (p) => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const { cols, w, h } = dims.current;
    const size = w / cols;
    ctx.clearRect(0, 0, w, h);
    const pp = mode === "build" ? 1 - p : p;
    const col = themeColors();
    for (const k of cells.current) {
      const edge = k.t - pp;
      if (edge <= 0) continue;
      // blocks right at the frontier flash in the accent: the "activation" edge
      ctx.fillStyle = edge < 0.035 ? col.accent : col[k.c];
      ctx.fillRect(k.x * size, k.y * size, Math.ceil(size), Math.ceil(size));
    }
  };

  useEffect(() => {
    const c = ref.current;
    const setup = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = r.width * dpr; c.height = r.height * dpr;
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.max(8, Math.round(r.width / cell));
      const rows = Math.ceil(r.height / (r.width / cols));
      dims.current = { cols, rows, w: r.width, h: r.height };
      const list = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const dx = x / cols - 0.5, dy = y / rows - 0.5;
          const radial = Math.min(1, Math.hypot(dx, dy * 0.8) * 1.6);
          // coarse noise so blocks clear in clumps, not uniformly
          const clump = Math.sin(x * 0.55) * Math.cos(y * 0.5) * 0.15;
          list.push({ x, y, c: pickSlot(), t: 0.04 + 0.62 * Math.random() * 0.75 + (1 - radial) * 0.25 + clump });
        }
      cells.current = list;
      draw(progress ? progress.get() : 0);
    };
    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(c);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell]);

  useEffect(() => {
    if (progress) return;
    if (reduce) {
      draw(1);
      onDone?.();
      return;
    }
    const ctl = animate(0, 1, { duration: 1.3, ease: [0.65, 0, 0.35, 1], onUpdate: draw, onComplete: () => onDone?.() });
    return () => ctl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idle = useMotionValue(0);
  useMotionValueEvent(progress ?? idle, "change", (v) => draw(reduce ? 1 : v));

  return <canvas ref={ref} className={`pointer-events-none block h-full w-full ${className}`} aria-hidden />;
}

/*
  Image that resolves from coarse to fine resolution (8px -> native), the way a feature map
  upsamples. Re-runs whenever src changes, so switching XAI methods "re-infers" the image.
*/
export function PixelImage({ src, alt, className = "", steps = [6, 10, 16, 28, 48, 96, 0] }) {
  const ref = useRef(null);
  const wrap = useRef(null);
  const inView = useInView(wrap, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();
  const [img, setImg] = useState(null);

  useEffect(() => {
    const im = new Image();
    im.src = src;
    im.onload = () => setImg(im);
  }, [src]);

  useEffect(() => {
    if (!img || !inView) return;
    const c = ref.current;
    const ctx = c.getContext("2d");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    let i = reduce ? steps.length - 1 : 0, timer;
    const paint = () => {
      const s = steps[i];
      ctx.imageSmoothingEnabled = s === 0;
      if (s === 0) {
        ctx.drawImage(img, 0, 0);
      } else {
        const w = s, h = Math.max(1, Math.round((s * img.naturalHeight) / img.naturalWidth));
        off.width = w; off.height = h;
        octx.drawImage(img, 0, 0, w, h);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(off, 0, 0, w, h, 0, 0, c.width, c.height);
      }
      if (++i < steps.length) timer = setTimeout(paint, 85);
    };
    paint();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, inView, src]);

  return (
    <div ref={wrap} className={className}>
      <canvas ref={ref} role="img" aria-label={alt} className="block h-full w-full object-cover" />
    </div>
  );
}
