import { useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { erpPipeline, erpScreens, erpStack, systems } from "../data";
import { EASE, Eyebrow, Reveal, SectionTitle } from "./ui";

/*
  Model Lab: the TriHub ERP pipeline as isometric glass modules on a grid floor, joined by a
  conduit that lights stage by stage as you scroll. Stages come from `erpPipeline` in data.js;
  the section is hidden until that list is filled in.
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
    <section id="lab" ref={wrap} className="relative overflow-hidden px-4 py-28 md:px-8">
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

        {/* Stage detail: always readable, flat */}
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {erpPipeline.map((m, i) => (
            <li key={m.id} className={`glass rounded-[18px] p-5 transition-colors duration-500 ${i <= active ? "border-blue-glow/60" : ""}`}>
              <p className="font-mono text-[11px] text-blue-glow">STAGE {String(i + 1).padStart(2, "0")}</p>
              <h3 className="display mt-2 text-3xl">{m.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{m.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <Reveal>
            <Screens />
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
