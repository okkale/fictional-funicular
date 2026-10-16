import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Copy, Check, GithubLogo, LinkedinLogo, Robot, Lightning, Browser, TreeStructure, Graph } from "@phosphor-icons/react";
import { experience, logos, metrics, profile, systems } from "../data";
import { CountUp, EASE, Eyebrow, Magnetic, Reveal, SectionTitle, Tilt, useSpotlight } from "./ui";
import { Monogram } from "./Nav";

/* Metric cards under the hero (Sharkfold): facts from the published paper, projects and ERP. */
export function Metrics() {
  const spot = useSpotlight();
  return (
    <section id="metrics" className="relative px-4 py-20 md:px-8">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        {metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.06} className={i === 4 ? "col-span-2 md:col-span-1" : ""}>
            <Tilt className="h-full">
            <div onMouseMove={spot} className="spotlight glass h-full rounded-[20px] p-6 md:p-7">
              <div className={`display whitespace-nowrap text-[clamp(2.75rem,4.4vw,4.75rem)] ${i === 0 ? "text-blue-glow" : ""}`}>
                {m.text ? (
                  <span className="inline-flex items-center gap-3">
                    <span className="live-dot h-3 w-3 rounded-full bg-accent shadow-[0_0_14px_var(--accent)]" aria-hidden />
                    {m.text}
                  </span>
                ) : (
                  <CountUp value={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} />
                )}
              </div>
              <p className="mt-4 max-w-[24ch] text-sm leading-snug text-muted">{m.label}</p>
            </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* Systems bento: 5 items, 5 cells. TriHub ERP is the live, featured one. */
const ICONS = [TreeStructure, Robot, Graph, Lightning, Browser];
export function Systems() {
  const spot = useSpotlight();
  const span = { lg: "md:col-span-4 md:row-span-2", md: "md:col-span-2 md:row-span-2", sm: "md:col-span-2" };
  return (
    <section id="systems" className="relative px-4 py-28 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <Eyebrow>IN PRODUCTION</Eyebrow>
          <SectionTitle className="mt-3">
            Software that runs on agents,
            <br className="hidden md:block" /> <span className="text-muted">used by real people.</span>
          </SectionTitle>
        </Reveal>
        <div className="mt-14 grid auto-rows-[minmax(200px,auto)] gap-4 md:grid-cols-6">
          {systems.map((s, idx) => {
            const Icon = ICONS[idx];
            const featured = idx === 0;
            const Tag = s.href ? "a" : "div";
            return (
              <Reveal key={s.title} delay={idx * 0.06} className={span[s.size]}>
                <Tilt className="h-full" max={featured ? 3 : 5}>
                <Tag
                  {...(s.href ? { href: s.href, target: "_blank", rel: "noreferrer" } : {})}
                  onMouseMove={spot}
                  className={`spotlight group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-line p-7 backdrop-blur-md transition-transform duration-500 ease-out-expo hover:-translate-y-1 ${
                    featured ? "border-blue/60 bg-[linear-gradient(140deg,#0252ac,#092659_55%,#591e28)] text-fg" : "glass"
                  }`}
                >
                  {featured && (
                    <div className="pointer-events-none absolute -bottom-16 -right-6 select-none text-[13rem] font-bold leading-none tracking-[-0.08em] opacity-[0.1] md:text-[17rem]" aria-hidden>
                      ERP
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`grid h-11 w-11 place-items-center rounded-[10px] ${featured ? "bg-white/10 text-fg" : "bg-surface-2 text-fg"}`}>
                      <Icon size={22} />
                    </span>
                    <span className={`flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs ${featured ? "bg-black/40 text-fg" : "border border-line text-muted"}`}>
                      {featured && <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
                      {s.tag}
                    </span>
                  </div>
                  <div className="mt-auto pt-12">
                    <h3 className={`font-semibold tracking-[-0.035em] ${featured ? "display text-6xl md:text-8xl" : "text-2xl"}`}>{s.title}</h3>
                    <p className={`mt-3 max-w-[46ch] leading-relaxed ${featured ? "text-lg text-fg/80" : "text-muted"}`}>{s.body}</p>
                    {s.href && (
                      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-ink transition-all group-hover:gap-3">
                        Open live app <ArrowUpRight size={14} weight="bold" />
                      </span>
                    )}
                  </div>
                </Tag>
                </Tilt>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* Experience timeline; the particle field becomes a helix beside it. */
export function Experience() {
  const reduce = useReducedMotion();
  return (
    <section id="experience" className="relative px-4 py-28 md:px-8">
      <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-[1fr_1.3fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <Eyebrow>EXPERIENCE</Eyebrow>
            <SectionTitle className="mt-3">
              Student by year.
              <br />
              <span className="text-muted">Builder by habit.</span>
            </SectionTitle>
            <p className="mt-6 max-w-[40ch] leading-relaxed text-muted">
              Alongside the degree I co-founded two ventures, which taught me to ship what people actually use.
            </p>
          </Reveal>
        </div>
        <ol className="relative">
          <motion.span
            aria-hidden
            className="absolute bottom-0 left-[7px] top-2 w-px origin-top bg-line"
            initial={reduce ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.6, ease: EASE }}
          />
          {experience.map((e, i) => (
            <Reveal key={e.role} delay={i * 0.08} as="li" className="relative pb-12 pl-12 last:pb-0">
              <span className={`absolute left-0 top-2 h-[15px] w-[15px] rounded-full border-2 border-bg ${i === 0 ? "bg-hud shadow-[0_0_12px_var(--hud)]" : "bg-muted"}`} />
              <p className="font-mono text-sm text-muted">{e.period}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{e.role}</h3>
              <p className="mt-1 text-accent-fg">{e.org}</p>
              <ul className="mt-4 space-y-1.5 text-muted">
                {e.points.map((pt) => (
                  <li key={pt} className="leading-relaxed">{pt}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* Toolkit: the page's single marquee, plus grouped skills. */
export function Stack() {
  const row = [...logos, ...logos];
  return (
    <section id="stack" className="relative py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal>
          <Eyebrow>TOOLKIT</Eyebrow>
          <SectionTitle className="mt-3">
            The toolkit <span className="text-muted">behind it</span>
          </SectionTitle>
        </Reveal>
      </div>
      <div className="marquee relative mt-14 overflow-hidden border-y border-line bg-bg/60 py-8 backdrop-blur-md [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee-track flex w-max items-center gap-16 pr-16">
          {row.map(([slug, name], i) => (
            <div key={i} className="flex items-center gap-3" title={name}>
              <span className="logo-glyph block h-8 w-8" style={{ "--src": `url(https://cdn.simpleicons.org/${slug})` }} role="img" aria-label={name} />
              <span className="font-mono text-sm text-muted">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Contact: one intent, one label. The particles close into a ring. */
export function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      window.location.href = `mailto:${profile.email}`;
    }
  };
  return (
    <section id="contact" className="relative overflow-hidden px-4 pb-10 pt-40 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(50%_60%_at_25%_100%,rgba(2,82,172,0.26),transparent_70%),radial-gradient(45%_55%_at_80%_100%,rgba(211,24,22,0.2),transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-[1400px]">
        <Reveal>
          <Eyebrow>CONTACT · OPEN TO ROLES</Eyebrow>
          <h2 className="display mt-4 text-[clamp(4rem,14vw,13rem)]">
            Let's build <span className="text-muted">what's next</span>
            <span className="text-accent">.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="mt-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="max-w-[46ch] text-lg leading-relaxed text-muted">
              Hiring an ML, applied AI or agent engineer for 2026 or 2027? Send me the role. Internships welcome too.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a href={`mailto:${profile.email}`} className="flex h-14 items-center gap-2.5 rounded-full bg-accent px-7 text-lg font-medium text-ink shadow-[0_0_40px_-8px_rgba(255,59,59,0.8)] active:scale-[0.98]">
                  Let's talk <ArrowUpRight size={18} weight="bold" />
                </a>
              </Magnetic>
              <button onClick={copy} className="flex h-14 items-center gap-2.5 rounded-full border border-line bg-bg/50 px-6 font-mono text-sm backdrop-blur transition hover:bg-surface-2 active:scale-[0.98]">
                {copied ? <Check size={16} className="text-accent-fg" /> : <Copy size={16} />}
                {copied ? "Copied" : profile.email}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              [profile.linkedin, LinkedinLogo, "LinkedIn"],
              [profile.github, GithubLogo, "GitHub"],
            ].map(([href, Icon, label]) => (
              <Magnetic key={label} strength={0.35}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-14 w-14 place-items-center rounded-full border border-line bg-bg/50 backdrop-blur transition hover:border-accent hover:bg-surface-2">
                  <Icon size={22} />
                </a>
              </Magnetic>
            ))}
          </div>
        </Reveal>
        <footer className="mt-32 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-sm text-muted sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Monogram className="h-8 w-8 text-[13px]" />
            <span>© {new Date().getFullYear()} {profile.name}</span>
          </div>
          <a href={profile.resume} download className="hover:text-fg">Résumé (PDF)</a>
        </footer>
      </div>
    </section>
  );
}
