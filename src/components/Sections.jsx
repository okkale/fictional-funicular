import { useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../perf";
import { ArrowUp, ArrowUpRight, Copy, Check, EnvelopeSimple, GithubLogo, LinkedinLogo, Robot, Lightning, Browser, TreeStructure, Graph } from "@phosphor-icons/react";
import { glideTo } from "../kale/glide";
import { runAction } from "../kale/store";
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

/* Systems bento: 5 items, 5 cells. TriHub ERP is the live, featured one. Every card shares one
   navy-to-wine glass so the grid reads as a set; the featured card is only a step brighter, and
   each card carries its own soft glow (blue or red) in a corner. */
const ICONS = [TreeStructure, Robot, Graph, Lightning, Browser];
const GLOWS = [
  "radial-gradient(60% 70% at 100% 0%, rgba(59,139,255,0.35), transparent 70%)",
  "radial-gradient(60% 70% at 0% 100%, rgba(255,59,59,0.22), transparent 70%)",
  "radial-gradient(70% 80% at 100% 100%, rgba(59,139,255,0.24), transparent 70%)",
  "radial-gradient(70% 80% at 0% 0%, rgba(255,59,59,0.2), transparent 70%)",
  "radial-gradient(60% 70% at 100% 0%, rgba(59,139,255,0.26), transparent 70%)",
];
export function Systems() {
  const spot = useSpotlight();
  const span = { lg: "md:col-span-4 md:row-span-2", md: "md:col-span-2 md:row-span-2", sm: "md:col-span-2" };
  return (
    <section id="systems" className="relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <Eyebrow>IN PRODUCTION</Eyebrow>
          <SectionTitle className="mt-3">
            Software that runs on agents,
            <br className="hidden md:block" /> <span className="text-muted">used by real people.</span>
          </SectionTitle>
        </Reveal>
        <div className="mt-10 grid auto-rows-[minmax(170px,auto)] gap-3 md:mt-14 md:auto-rows-[minmax(200px,auto)] md:grid-cols-6 md:gap-4">
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
                  className={`spotlight group relative flex h-full flex-col overflow-hidden rounded-[20px] border p-6 transition-transform duration-500 ease-out-expo hover:-translate-y-1 md:p-7 ${
                    featured
                      ? "border-blue-glow/45 bg-[linear-gradient(150deg,rgba(2,82,172,0.42),rgba(9,38,89,0.55)_55%,rgba(89,30,40,0.45))]"
                      : "border-white/10 bg-[linear-gradient(150deg,rgba(2,82,172,0.14),rgba(9,38,89,0.3)_55%,rgba(89,30,40,0.16))]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0" style={{ background: GLOWS[idx] }} aria-hidden />
                  {featured && (
                    <div className="pointer-events-none absolute -bottom-12 -right-4 select-none text-[9rem] font-bold leading-none tracking-[-0.08em] opacity-[0.08] md:-bottom-16 md:-right-6 md:text-[17rem]" aria-hidden>
                      ERP
                    </div>
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className={`grid h-11 w-11 place-items-center rounded-[10px] border ${featured ? "border-blue-glow/40 bg-blue/30 text-fg" : "border-white/10 bg-white/[0.06] text-fg"}`}>
                      <Icon size={22} />
                    </span>
                    <span className={`flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${featured ? "border-white/15 bg-black/40 text-fg" : "border-white/10 bg-black/20 text-muted"}`}>
                      {featured && <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
                      {s.tag}
                    </span>
                  </div>
                  <div className="relative mt-auto pt-10 md:pt-12">
                    <h3 className={`font-semibold tracking-[-0.035em] ${featured ? "display text-5xl md:text-8xl" : "text-xl md:text-2xl"}`}>{s.title}</h3>
                    <p className={`mt-3 max-w-[46ch] leading-relaxed ${featured ? "text-fg/80 md:text-lg" : "text-[15px] text-muted md:text-base"}`}>{s.body}</p>
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
              <span className="logo-glyph block h-8 w-8" style={{ "--src": `url(/logos/${slug}.svg)` }} role="img" aria-label={name} />
              <span className="font-mono text-sm text-muted">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Footer: who this is, where to reach him, where to go on the page. The résumé lives in the nav
   and on the landing, so it isn't repeated here. */
const CONNECT = [
  [profile.linkedin, LinkedinLogo, "LinkedIn", "omkar-kale"],
  [profile.github, GithubLogo, "GitHub", "okkale"],
  [`mailto:${profile.email}`, EnvelopeSimple, "Email", profile.email],
];
const EXPLORE = [
  ["#projects", "Projects"],
  ["#expertise", "Skills"],
  ["#lab", "TriHub ERP"],
  ["#experience", "Experience"],
];
function Footer() {
  return (
    <footer className="mt-24 border-t border-line pt-10 md:mt-32">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.8fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Monogram className="h-9 w-9 text-[13px]" />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">{profile.name}</span>
          </div>
          <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-muted">
            AI engineering student in Pune. Explainable deep learning research, and AI agents inside software people use.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Open to ML / AI roles and internships
          </p>
        </div>
        <nav aria-label="Connect">
          <p className="font-mono text-xs tracking-[0.12em] text-muted">CONNECT</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {CONNECT.map(([href, Icon, label, handle]) => (
              <li key={label}>
                <a
                  href={href}
                  {...(href.startsWith("http") ? { target: "_blank", rel: "me noreferrer" } : {})} /* rel="me": these profiles are the same person as this site */
                  className="group flex items-center gap-3 py-3 text-sm text-fg/90 transition-colors hover:text-fg"
                >
                  <Icon size={18} className="shrink-0 text-muted transition-colors group-hover:text-hud" />
                  <span>{label}</span>
                  <span className="ml-auto min-w-0 truncate font-mono text-xs text-muted">{handle}</span>
                  <ArrowUpRight size={13} className="shrink-0 text-muted transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Explore">
          <p className="font-mono text-xs tracking-[0.12em] text-muted">EXPLORE</p>
          <ul className="mt-3 space-y-0.5">
            {EXPLORE.map(([target, label]) => (
              <li key={target}>
                <a
                  href={target}
                  onClick={(e) => (e.preventDefault(), runAction({ type: "scroll", target }))}
                  className="block py-2 text-sm text-fg/80 transition-colors hover:text-fg"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Phones: extra room at the bottom so the Kyle button never sits on "Back to top" */}
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pb-24 pt-6 text-xs text-muted md:pb-6">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <button onClick={() => glideTo(0)} className="group inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 transition-colors hover:border-white/25 hover:text-fg">
          Back to top <ArrowUp size={13} className="transition-transform group-hover:-translate-y-0.5" />
        </button>
      </div>
    </footer>
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
    <section id="contact" className="relative overflow-hidden px-4 pb-[env(safe-area-inset-bottom,0px)] pt-24 md:px-8 md:pt-40">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(50%_60%_at_25%_100%,rgba(2,82,172,0.26),transparent_70%),radial-gradient(45%_55%_at_80%_100%,rgba(211,24,22,0.2),transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-[1400px]">
        <Reveal>
          <Eyebrow>CONTACT · OPEN TO ROLES</Eyebrow>
          <h2 className="display mt-4 text-[clamp(4rem,14vw,13rem)]">
            Let's build <span className="text-muted">what's next</span>
            <span className="text-accent">.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="mt-10">
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
        </Reveal>
        <Footer />
      </div>
    </section>
  );
}
