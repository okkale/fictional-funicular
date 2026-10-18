import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "../perf";
import { ArrowUpRight } from "@phosphor-icons/react";
import { expertise } from "../data";
import { runAction } from "../kale/store";
import { EASE, Eyebrow, Reveal, SectionTitle, Tilt } from "./ui";

/*
  Expertise: five areas, each skill backed by proof chips that jump to the work behind it.
  No self-rated percentages anywhere. Desktop: area tabs beside a skill panel. Phones and tablets:
  a skill map, every area and every skill on screen at once; tapping a skill opens its proof.
*/

const list = { shown: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function Proof({ skill }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {skill.proof.length ? (
        skill.proof.map((p) => (
          <button
            key={p.label}
            onClick={() => runAction({ type: "scroll", target: p.target, tab: p.tab })}
            className="group/chip inline-flex items-center gap-1.5 rounded-full border border-blue-glow/30 bg-blue/10 px-3 py-1 font-mono text-[11px] text-fg/85 transition hover:border-blue-glow hover:bg-blue/30"
          >
            {p.label}
            <ArrowUpRight size={11} weight="bold" className="transition-transform group-hover/chip:-translate-y-px group-hover/chip:translate-x-px" />
          </button>
        ))
      ) : (
        <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted">Toolkit</span>
      )}
    </div>
  );
}

function SkillMap() {
  const [open, setOpen] = useState(null); // "area:skill"
  return (
    <div className="mt-10 space-y-3 lg:hidden">
      {expertise.map((e, i) => {
        const sel = e.skills.find((s) => open === `${e.id}:${s.name}`);
        return (
          <Reveal key={e.id} delay={i * 0.05} y={16}>
            <div className="glass rounded-[18px] p-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-blue-glow">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="display text-[1.7rem] leading-none">{e.name}</h3>
                <span className="ml-auto font-mono text-xs text-muted">{e.skills.length}</span>
              </div>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {e.skills.map((s) => {
                  const on = sel === s;
                  return (
                    <li key={s.name}>
                      <button
                        aria-expanded={on}
                        onClick={() => setOpen(on ? null : `${e.id}:${s.name}`)}
                        className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-200 active:scale-[0.97] ${
                          on ? "border-blue-glow bg-blue/25 text-fg" : "border-line bg-bg/40 text-fg/85"
                        }`}
                      >
                        {s.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <AnimatePresence initial={false}>
                {sel && (
                  <motion.div
                    key={sel.name}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-[12px] border border-blue-glow/25 bg-bg/50 p-3.5">
                      <p className="text-sm font-semibold">{sel.name}</p>
                      {sel.note && <p className="mt-1 text-[13px] leading-snug text-muted">{sel.note}</p>}
                      <Proof skill={sel} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export default function Expertise() {
  const [active, setActive] = useState(expertise[0].id);
  const reduce = useReducedMotion();
  const tabs = useRef([]);
  const area = expertise.find((e) => e.id === active);
  const total = expertise.reduce((n, e) => n + e.skills.length, 0);

  const onKey = (e, i) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (i + d + expertise.length) % expertise.length;
    setActive(expertise[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <section id="expertise" className="relative overflow-hidden px-4 py-20 md:px-8 md:py-28">
      <div className="pointer-events-none absolute left-0 top-1/3 h-[420px] w-[420px] rounded-full bg-blue/20 blur-[120px]" aria-hidden />
      <div className="relative mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <Eyebrow>EXPERTISE · {total} SKILLS · 5 AREAS</Eyebrow>
            </Reveal>
            <SectionTitle className="mt-3">
              What I'm <span className="text-muted">good at</span>
            </SectionTitle>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-[36ch] text-muted">
              No self-ratings. Every skill links to the paper or project where I used it.
              <span className="lg:hidden"> Tap a skill to see where.</span>
            </p>
          </Reveal>
        </div>

        <SkillMap />

        <div className="mt-14 hidden gap-6 lg:grid lg:grid-cols-[400px_1fr]">
          {/* Areas */}
          <div role="tablist" aria-label="Expertise areas" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0">
            {expertise.map((e, i) => {
              const on = e.id === active;
              return (
                <button
                  key={e.id}
                  ref={(el) => (tabs.current[i] = el)}
                  role="tab"
                  id={`exp-tab-${e.id}`}
                  aria-selected={on}
                  aria-controls="exp-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(e.id)}
                  onKeyDown={(ev) => onKey(ev, i)}
                  className={`group relative flex shrink-0 items-center gap-4 overflow-hidden rounded-[16px] border px-5 py-4 text-left transition-colors duration-300 lg:py-5 ${
                    on ? "border-blue-glow/60 bg-blue/15" : "border-line hover:border-steel/50 hover:bg-surface/60"
                  }`}
                >
                  {on && <motion.span layoutId="exp-bar" className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-blue-glow shadow-[0_0_14px_#3b8bff]" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className={`font-mono text-xs ${on ? "text-blue-glow" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={`display whitespace-nowrap text-2xl transition-colors lg:text-4xl ${on ? "text-fg" : "text-muted group-hover:text-fg"}`}>{e.name}</span>
                  <span className="ml-auto hidden font-mono text-xs text-muted lg:block">{e.skills.length}</span>
                </button>
              );
            })}
          </div>

          {/* Skills */}
          <div id="exp-panel" role="tabpanel" aria-labelledby={`exp-tab-${active}`} className="glass relative min-h-[420px] overflow-hidden rounded-[24px] p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={reduce ? false : "hidden"} animate="shown" exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }} variants={list}>
                <motion.p variants={item} className="max-w-[60ch] text-lg leading-relaxed text-fg/90">
                  {area.blurb}
                </motion.p>
                <ul className="mt-8 grid gap-4 md:grid-cols-2">
                  {area.skills.map((s) => (
                    <motion.li key={s.name} variants={item}>
                      <Tilt className="h-full">
                        <div className="h-full rounded-[16px] border border-line bg-bg/50 p-5 transition-colors duration-300 hover:border-blue-glow/50">
                          <h3 className="text-lg font-semibold tracking-[-0.02em]">{s.name}</h3>
                          {s.note && <p className="mt-1 text-sm text-muted">{s.note}</p>}
                          <Proof skill={s} />
                        </div>
                      </Tilt>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
