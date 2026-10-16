import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { projects } from "../data";
import { PixelImage } from "./pixel";
import { themeColors } from "../colors";
import { Eyebrow, Reveal, SectionTitle, Tilt } from "./ui";
import { PublishedProject } from "./Research";

// Live waveform: a speech signal being transcribed, drawn per frame on canvas.
function WaveVisual() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let raf, t = 0;
    const col = themeColors();
    const draw = () => {
      const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
      if (c.width !== r.width * dpr) { c.width = r.width * dpr; c.height = r.height * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const bars = 64, bw = r.width / bars, head = (t * 0.25) % 1;
      for (let i = 0; i < bars; i++) {
        const x = i / bars;
        const amp = Math.abs(Math.sin(i * 0.45 + t) * Math.sin(i * 0.13 + t * 0.6)) * (0.35 + 0.65 * Math.exp(-Math.pow((x - 0.5) / 0.35, 2)));
        const h = Math.max(3, amp * r.height * 0.7);
        ctx.fillStyle = x < head ? col.blue : col.surface2;
        ctx.fillRect(i * bw + 1.5, (r.height - h) / 2, bw - 3, h);
      }
      if (!reduce) { t += 0.03; raf = requestAnimationFrame(draw); }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}

// Route graph: heritage stops being connected by the recommender.
function RouteVisual() {
  const reduce = useReducedMotion();
  const pts = [[12, 70], [30, 38], [52, 58], [70, 24], [88, 46]];
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
  return (
    <svg viewBox="0 0 100 90" className="h-full w-full" aria-hidden>
      <path d={d} fill="none" style={{ stroke: "var(--line)" }} strokeWidth="0.6" />
      <motion.path d={d} fill="none" style={{ stroke: "var(--blue-glow)" }} strokeWidth="0.8" initial={{ pathLength: reduce ? 1 : 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 2.4, ease: "easeInOut" }} />
      {pts.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r="2.2" style={{ fill: i === pts.length - 1 ? "var(--accent)" : "var(--text)" }} initial={reduce ? false : { scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.4, type: "spring", stiffness: 260, damping: 16 }} />
      ))}
    </svg>
  );
}

// Attention by semester week: the weeks the temporal model weighted most light up.
function AttentionVisual({ weeks, peakWeeks }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full items-end gap-1.5 px-6 pb-6 pt-8" aria-hidden>
      {Array.from({ length: weeks }, (_, w) => {
        const hot = peakWeeks.includes(w + 1);
        const h = hot ? 78 + (w % 2) * 10 : 22 + ((w * 37) % 30);
        return (
          <div key={w} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <motion.div
              className={`w-full rounded-t-[4px] ${hot ? "bg-blue-glow shadow-[0_0_16px_rgba(59,139,255,0.6)]" : "bg-white/10"}`}
              initial={reduce ? false : { height: "0%" }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: w * 0.04, ease: [0.16, 1, 0.3, 1] }}
              style={reduce ? { height: `${h}%` } : undefined}
            />
            <span className={`font-mono text-[9px] ${hot ? "text-blue-glow" : "text-muted"}`}>W{w + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

function Visual({ v }) {
  if (v.type === "attention") return <AttentionVisual weeks={v.weeks} peakWeeks={v.peakWeeks} />;
  if (v.type === "image") return <PixelImage src={v.src} alt="Explanation overlay on a chest X-ray" className="h-full w-full" />;
  if (v.type === "wave") return <WaveVisual />;
  return <RouteVisual />;
}

/*
  Projects: one section. It leads with the published paper (pneumonia detection with explainable
  AI), then the other builds. Each card says what goes in, what model runs, and what comes out.
*/
export default function Projects() {
  return (
    <section id="projects" className="relative px-4 py-28 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Eyebrow>SELECTED PROJECTS</Eyebrow>
        <SectionTitle className="mt-3">
          Projects <span className="text-muted">I've built</span>
        </SectionTitle>
        <Reveal delay={0.05}>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">
            Deep learning taken from dataset to working pipeline. One is published, one paper is in progress, and every one runs.
          </p>
        </Reveal>

        <div className="mt-12">
          <PublishedProject />
        </div>

        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((pr, i) => (
            <Reveal as="li" key={pr.title} delay={i * 0.08}>
              <Tilt className="h-full">
                <article className="glass flex h-full flex-col overflow-hidden rounded-[20px] transition duration-500 ease-out-expo hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden border-b border-line bg-black/60">
                    <Visual v={pr.visual} />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-xs text-muted">{pr.kind}</p>
                      {pr.status && <span className="rounded-full border border-blue-glow/40 px-2.5 py-0.5 font-mono text-[11px] text-blue-glow">{pr.status}</span>}
                    </div>
                    <h3 className="display mt-3 text-3xl">{pr.title}</h3>
                    {pr.team && <p className="mt-1 text-xs text-muted">{pr.team}</p>}
                    <p className="mt-3 text-sm leading-relaxed text-muted">{pr.body}</p>
                    {pr.results && (
                      <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[12px] border border-line bg-line">
                        {pr.results.map(([v, k]) => (
                          <div key={k} className="bg-surface px-3 py-2">
                            <p className="display text-2xl">{v}</p>
                            <p className="text-[11px] text-muted">{k}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                      {[["In", pr.scan.input], ["Model", pr.scan.model], ["Out", pr.scan.output]].map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[3.5rem_1fr] gap-3">
                          <dt className="font-mono text-xs leading-5 text-muted">{k}</dt>
                          <dd className="leading-5 text-fg/85">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    {pr.href && (
                      <a href={pr.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-fg">
                        Code <ArrowUpRight size={14} weight="bold" />
                      </a>
                    )}
                  </div>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
