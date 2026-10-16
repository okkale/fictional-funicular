import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";

export const EASE = [0.16, 1, 0.3, 1];

// Fade + rise when the element enters the viewport.
export function Reveal({ children, delay = 0, y = 28, className = "", as = "div" }) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

// Headline whose words rise out of a mask one after another.
export function SplitWords({ text, className = "", delay = 0, muted = [] }) {
  const reduce = useReducedMotion();
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className={`inline-block ${muted.includes(i) ? "text-muted" : ""}`}
            initial={reduce ? false : { y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: delay + i * 0.06, ease: EASE }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// Button that leans toward the cursor.
export function Magnetic({ children, strength = 0.3, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 150, damping: 15, mass: 0.2 });
  const y = useSpring(useMotionValue(0), { stiffness: 150, damping: 15, mass: 0.2 });
  const onMove = (e) => {
    if (reduce) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={reset} style={{ x, y }} className={`inline-block ${className}`}>
      {children}
    </motion.div>
  );
}

const fmt = (v, d) => (d ? v.toFixed(d) : Math.round(v).toLocaleString("en-IN"));

// Counts up from zero when visible.
export function CountUp({ value, prefix = "", suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) {
      ref.current.textContent = prefix + fmt(value, decimals) + suffix;
      return;
    }
    const controls = animate(0, value, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = prefix + fmt(v, decimals) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, prefix, suffix, decimals, reduce]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// Text that decodes from random glyphs into the target word, cycling through a list.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";
export function Scramble({ words, interval = 2600, className = "" }) {
  const [i, setI] = useState(0);
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || words.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [reduce, words.length, interval]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = words[i];
    if (reduce) {
      el.textContent = target;
      return;
    }
    let frame = 0;
    let raf;
    const total = target.length * 3;
    const tick = () => {
      frame++;
      el.textContent = target
        .split("")
        .map((c, k) => (k < frame / 3 ? c : c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
      if (frame < total) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [i, words, reduce]);
  return <span ref={ref} className={className} aria-live="polite" />;
}

// Writes cursor coordinates into CSS vars for the .spotlight border.
export function useSpotlight() {
  return (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
}

// Section label: Kyle's gold, as a HUD tick and a mono caption. Every section opens with one,
// so the guide's colour runs through the whole page, not just the landing.
export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`flex items-center gap-2.5 font-mono text-xs tracking-[0.2em] text-hud ${className}`}>
      <span aria-hidden className="h-px w-6 bg-hud/70 shadow-[0_0_8px_var(--hud)]" />
      {children}
    </p>
  );
}

// Section headline: wipes in left to right behind a light sweep. The in-view trigger sits on an
// unclipped wrapper: Chrome's IntersectionObserver honours the heading's own clip-path, so a fully
// clipped heading would never count as visible.
const wipe = {
  hidden: { clipPath: "inset(0 100% 0 0)", y: 18 },
  shown: { clipPath: "inset(0 0% 0 0)", y: 0, transition: { duration: 1.1, ease: EASE } },
};
const sweep = {
  hidden: { left: "-10%", opacity: 0 },
  shown: { left: "105%", opacity: [0, 1, 0], transition: { duration: 1.2, delay: 0.25, ease: "easeInOut" } },
};
export function SectionTitle({ children, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : "hidden"} whileInView="shown" viewport={{ once: true, amount: 0.4 }} className={className}>
      <motion.h2 variants={wipe} className="display relative text-5xl md:text-7xl lg:text-8xl">
        {children}
        {!reduce && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.span variants={sweep} className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-hud/50 to-transparent mix-blend-screen" />
          </span>
        )}
      </motion.h2>
    </motion.div>
  );
}

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

// Card that tilts toward the cursor (max 6°) with a soft spring. Off for touch and reduced motion.
export function Tilt({ children, className = "", max = 6 }) {
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  if (reduce || !finePointer()) return <div className={className}>{children}</div>;
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };
  return (
    <motion.div onMouseMove={onMove} onMouseLeave={reset} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }} className={className}>
      {children}
    </motion.div>
  );
}

// A soft light that trails the cursor across the page (desktop only).
export function CursorGlow() {
  const reduce = useReducedMotion();
  const x = useSpring(-400, { stiffness: 90, damping: 20, mass: 0.6 });
  const y = useSpring(-400, { stiffness: 90, damping: 20, mass: 0.6 });
  useEffect(() => {
    if (reduce || !finePointer()) return;
    const on = (e) => {
      x.set(e.clientX - 300);
      y.set(e.clientY - 300);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduce, x, y]);
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(59,139,255,0.10),rgba(255,59,59,0.05)_45%,transparent_70%)] [@media(pointer:fine)]:block"
    />
  );
}
