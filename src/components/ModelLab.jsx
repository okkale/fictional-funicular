import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useMotionValueEvent, useScroll } from "motion/react";
import { useReducedMotion } from "../perf";
import { ArrowUpRight } from "@phosphor-icons/react";
import { erpPipeline, erpScreens, erpStack, systems } from "../data";
import { EASE, Eyebrow, Reveal, SectionTitle } from "./ui";

/*
  Model Lab: the TriHub ERP pipeline as isometric glass modules on a grid floor, joined by a
  conduit that lights stage by stage as you scroll. Stages come from `erpPipeline` in data.js;
  the section is hidden until that list is filled in. Phones get the same flow as a small
  vertical flowchart, and the screens as an auto-sliding carousel.
*/
// Real demo screens by role, in a browser frame. Tabs switch with a short cross-fade.
function Screens() {
  const [id, setId] = useState(erpScreens[0].id);
  const shot = erpScreens.find((x) => x.id === id);
  return (
    <div>
      <div role="tablist" aria-label="TriHub ERP screens" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {erpScreens.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={x.id === id}
            onClick={() => setId(x.id)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${x.id === id ? "text-fg" : "text-muted hover:text-fg"}`}
          >
            {x.id === id && <motion.span layoutId="erp-tab" className="absolute inset-0 rounded-full border border-blue-glow/50 bg-blue/25" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />}
            <span className="relative">{x.label}</span>
          </button>
        ))}
      </div>
      <figure className="mt-4 overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_40px_120px_-40px_rgba(2,82,172,0.6)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <div className="relative aspect-[1600/1046] bg-white">
          <AnimatePresence initial={false}>
            <motion.img
              key={shot.id}
              src={shot.src}
              alt={`TriHub ERP, ${shot.caption}`}
              loading="lazy"
              decoding="async"
              initial={{ opacity: 0, scale: 1.01 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </AnimatePresence>
        </div>
        <figcaption className="border-t border-line px-4 py-3 text-sm text-muted">{shot.caption} Demo data.</figcaption>
      </figure>
    </div>
  );
}

// Phones: the screens slide on their own every few seconds, and can be swiped. Touching pauses the
// auto-advance for a while; it only runs while the carousel is on screen.
function ScreenCarousel() {
  const track = useRef(null);
  const [i, setI] = useState(0);
  const held = useRef(0); // auto-advance resumes after this time
  const inView = useInView(track, { amount: 0.5 });
  const n = erpScreens.length;
  const go = (k) => {
    const el = track.current;
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
  };
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      if (document.hidden || performance.now() < held.current) return;
      go((Math.round(track.current.scrollLeft / track.current.clientWidth) + 1) % n);
    }, 3500);
    return () => clearInterval(id);
  }, [inView, n]);
  // The dots and the name follow the slide that is actually showing, however it got there.
  const onScroll = () => {
    const el = track.current;
    setI(Math.round(el.scrollLeft / el.clientWidth));
  };
  const hold = () => (held.current = performance.now() + 6000);
  const shot = erpScreens[Math.min(n - 1, Math.max(0, i))];
  return (
    <div className="md:hidden">
      <figure className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-[0_30px_80px_-30px_rgba(2,82,172,0.6)]">
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-2" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
        </div>
        <div
          ref={track}
          onScroll={onScroll}
          onTouchStart={hold}
          onPointerDown={hold}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="TriHub ERP screens"
        >
          {erpScreens.map((x) => (
            <div key={x.id} className="relative aspect-[1600/1046] w-full shrink-0 snap-center bg-white">
              <img src={x.src} alt={`TriHub ERP, ${x.caption}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
            </div>
          ))}
        </div>
      </figure>
      <div className="mt-3 flex items-start justify-between gap-4" aria-live="polite">
        <div className="min-w-0">
          <p className="display text-2xl leading-none">{shot.label}</p>
          <p className="mt-1.5 text-[13px] leading-snug text-muted">{shot.caption}</p>
        </div>
        <div className="flex shrink-0 gap-1.5 pt-1.5">
          {erpScreens.map((x, k) => (
            <button
              key={x.id}
              onClick={() => (hold(), go(k))}
              aria-label={`Show ${x.label}`}
              aria-current={k === i}
              className="grid h-6 w-4 place-items-center"
            >
              <span className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-4 bg-blue-glow" : "w-1.5 bg-white/25"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModelLab() {
  const wrap = useRef(null);
  const reduce = useReducedMotion();
  const n = erpPipeline.length;
  const [active, setActive] = useState(reduce ? n - 1 : -1);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start 0.7", "end 0.6"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!reduce) setActive(Math.min(n - 1, Math.floor(v * (n + 0.2)) - 0));
  });
  if (!n) return null;
  const live = systems.find((s) => s.href);

  return (
    <section id="lab" ref={wrap} className="relative overflow-hidden px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Eyebrow>MODEL LAB · TRIHUB ERP</Eyebrow>
            <SectionTitle className="mt-3">
              From record <span className="text-muted">to action</span>
            </SectionTitle>
          </Reveal>
          {live && (
            <a href={live.href} target="_blank" rel="noreferrer" className="flex h-12 items-center gap-2 rounded-full border border-blue-glow/50 px-5 text-sm font-medium transition hover:bg-blue">
              <span className="live-dot h-2 w-2 rounded-full bg-accent" aria-hidden /> Open live ERP <ArrowUpRight size={14} weight="bold" />
            </a>
          )}
        </div>

        {/* Isometric floor (desktop) */}
        <div className="dot-field relative mt-16 hidden rounded-[28px] border border-line py-24 md:block" style={{ perspective: "1600px" }}>
          <ol className="relative mx-auto flex max-w-[1100px] items-center justify-between px-10" style={{ transform: "rotateX(52deg) rotateZ(-28deg)", transformStyle: "preserve-3d" }}>
            {erpPipeline.map((m, i) => {
              const on = i <= active;
              return (
                <li key={m.id} className="relative flex flex-1 items-center">
                  <motion.div
                    animate={{ y: on ? -18 : 0 }}
                    transition={{ type: "spring", stiffness: 160, damping: 18 }}
                    className={`relative z-10 w-full max-w-[170px] rounded-[14px] border p-4 backdrop-blur-md transition-colors duration-500 ${
                      on ? "border-blue-glow bg-blue/30 shadow-[0_30px_60px_-10px_rgba(59,139,255,0.6)]" : "border-line bg-surface/60"
                    }`}
                  >
                    <p className="font-mono text-[10px] text-muted">{String(i + 1).padStart(2, "0")}</p>
                    <p className="display mt-1 text-2xl">{m.label}</p>
                  </motion.div>
                  {i < n - 1 && (
                    <span className="relative mx-2 h-[3px] flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
                      <motion.span className="absolute inset-y-0 left-0 bg-blue-glow shadow-[0_0_12px_#3b8bff]" animate={{ width: i < active ? "100%" : "0%" }} transition={{ duration: 0.6 }} />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Phones: a small vertical flowchart that lights stage by stage, with the current
            stage's detail in one caption below (fixed height, so nothing jumps while scrolling). */}
        <div className="mt-10 rounded-[20px] border border-line p-4 dot-field md:hidden">
          <ol className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {erpPipeline.map((m, i) => {
              const on = i <= active;
              return (
                <li
                  key={m.id}
                  className={`flex items-center gap-2.5 rounded-[12px] border px-3 py-2.5 transition-colors duration-500 ${
                    on ? "border-blue-glow/70 bg-blue/25 shadow-[0_8px_24px_-10px_rgba(59,139,255,0.7)]" : "border-line bg-surface/60"
                  }`}
                >
                  <span className={`font-mono text-[10px] ${on ? "text-blue-glow" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={`display text-lg leading-none ${on ? "text-fg" : "text-muted"}`}>{m.label}</span>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-line" aria-hidden>
            <motion.div className="h-full bg-blue-glow shadow-[0_0_12px_#3b8bff]" animate={{ width: `${((Math.max(0, active) + 1) / n) * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
          <p className="mt-3 min-h-[2.6rem] text-[13px] leading-snug text-muted" aria-live="polite">
            <span className="text-fg">{erpPipeline[Math.max(0, active)].label}:</span> {erpPipeline[Math.max(0, active)].detail}
          </p>
        </div>

        {/* Stage detail: always readable, flat (tablet and desktop) */}
        <ol className="mt-10 hidden gap-4 sm:grid-cols-2 md:grid lg:grid-cols-4">
          {erpPipeline.map((m, i) => (
            <li key={m.id} className={`glass rounded-[18px] p-5 transition-colors duration-500 ${i <= active ? "border-blue-glow/60" : ""}`}>
              <p className="font-mono text-[11px] text-blue-glow">STAGE {String(i + 1).padStart(2, "0")}</p>
              <h3 className="display mt-2 text-3xl">{m.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{m.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-10 md:mt-20 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <Reveal>
            <ScreenCarousel />
            <div className="hidden md:block">
              <Screens />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-14">
            <h3 className="display text-4xl md:text-5xl">
              How it's <span className="text-muted">built</span>
            </h3>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {erpStack.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3.5">
                  <dt className="font-mono text-xs text-muted">{k}</dt>
                  <dd className="text-sm leading-relaxed text-fg/90">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
