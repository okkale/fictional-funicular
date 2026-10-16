import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, SealCheck } from "@phosphor-icons/react";
import { xaiPaper } from "../data";
import { EASE, Reveal } from "./ui";
import { PixelImage } from "./pixel";

/*
  The published project: CNN-driven pneumonia detection with explainable AI (first author).
  Leads the Projects section. Interactive viewer: the same X-ray explained three ways.
  Qualitative only, no accuracy figures on the site.
*/
export function PublishedProject() {
  const [m, setM] = useState(xaiPaper.methods[0]);
  return (
    <div className="glass grid gap-10 rounded-[24px] p-6 md:p-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-start lg:gap-14">
      <div>
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 px-3 py-1 text-accent-fg">
              <SealCheck size={14} weight="fill" /> {xaiPaper.role}
            </span>
            <span>{xaiPaper.year}</span>
          </div>
          <h3 className="mt-5 max-w-[24ch] text-3xl font-semibold leading-[1.08] tracking-[-0.03em] md:text-4xl">{xaiPaper.title}</h3>
          <p className="mt-3 font-mono text-xs text-muted">{xaiPaper.authors}</p>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-fg/80">{xaiPaper.question}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {xaiPaper.stack.map((t) => (
              <span key={t} className="rounded-full bg-surface-2 px-3 py-1 font-mono text-xs text-muted">{t}</span>
            ))}
          </div>
        </Reveal>
        <ol className="mt-8 space-y-4">
          {xaiPaper.findings.map((f, i) => (
            <Reveal key={f} as="li" delay={i * 0.08} className="grid grid-cols-[2.25rem_1fr] gap-2 border-t border-line pt-4">
              <span className="font-mono text-sm text-accent-fg">{String(i + 1).padStart(2, "0")}</span>
              <span className="leading-relaxed">{f}</span>
            </Reveal>
          ))}
        </ol>
        {xaiPaper.href && (
          <a href={xaiPaper.href} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 font-medium text-accent-fg hover:underline">
            Read the paper <ArrowUpRight size={16} weight="bold" />
          </a>
        )}
      </div>

      <Reveal delay={0.1}>
        <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[20px] border border-line bg-bg/60">
          <div className="flex gap-1 border-b border-line p-2" role="tablist" aria-label="Explanation method">
            {xaiPaper.methods.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={m.id === x.id}
                onClick={() => setM(x)}
                className={`relative flex-1 rounded-full px-4 py-2.5 font-mono text-sm transition-colors ${m.id === x.id ? "text-fg" : "text-muted hover:text-fg"}`}
              >
                {m.id === x.id && <motion.span layoutId="xai-pill" className="absolute inset-0 rounded-full bg-blue" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />}
                <span className="relative">{x.label}</span>
              </button>
            ))}
          </div>
          <div className="relative aspect-square bg-black">
            <PixelImage key={m.id} src={m.src} alt={`${m.label} explanation on a chest X-ray`} className="absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-16">
              <AnimatePresence mode="wait">
                <motion.p key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }} className="font-mono text-sm text-white/85">
                  {m.note}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-[460px] font-mono text-xs text-muted">Same X-ray, three explanation methods. Output from the study.</p>
      </Reveal>
    </div>
  );
}
