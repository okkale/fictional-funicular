import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "../perf";
import { ArrowRight, DownloadSimple, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import Typed from "./Typed";
import { NAME } from "./intents";
import { ask, kale, setVoice, setVoiceGender, startTour, useKale } from "./store";
import { supported } from "./voice";
import { useSnapToHero } from "./useSnapToHero";
import { profile } from "../data";
import { EASE } from "../components/ui";
import { Monogram } from "../components/Nav";

const Sphere = lazy(() => import("./Sphere"));
// No WebGL (hardware acceleration off): the same sphere, drawn with canvas 2D. `?2d` forces it.
const Sphere2D = lazy(() => import("./Sphere2D"));
const hasWebgl = () => typeof window === "undefined" || !new URLSearchParams(window.location.search).has("2d");

/*
  Page 1: Kyle The holographic sphere fills the screen; the UI is three things only:
  who this is, three ways in, and a box to ask a question. One scroll glides to page 2 while the
  camera flies into the sphere (useSnapToHero + the section's scroll progress).
*/

const BOOT_MS = 2600;

const PATHS = [
  ["recruiter", "I'm hiring"],
  ["engineer", "I'm an engineer"],
  ["explore", "Just looking"],
];
const QUICK = ["What has he published?", "Show the ERP", "His skills"];
// Facts from the published paper, the projects and the live ERP only.
const FACTS = [
  ["1", "Published paper, first author"],
  ["4", "AI projects built"],
  ["Live", "TriHub ERP with AI agents"],
];

export default function Landing() {
  const wrap = useRef(null);
  const reduce = useReducedMotion();
  const { voiceOn, voiceGender, log } = useKale();
  const [bootDone, setBootDone] = useState(false);
  const booted = bootDone || !!reduce;
  const [skip, setSkip] = useState(false);
  const [webgl, setWebgl] = useState(hasWebgl);
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState(false);
  const onFail = useCallback(() => setWebgl(false), []);

  useSnapToHero({ reduce: !!reduce });

  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(() => setBootDone(true), BOOT_MS);
    return () => clearTimeout(id);
  }, [reduce]);

  // 0 → 1 as the landing leaves the viewport; drives the camera fly-in and the UI fade.
  const { scrollYProgress: p } = useScroll({ target: wrap, offset: ["start start", "end start"] });
  const uiOpacity = useTransform(p, [0, 0.35], [1, 0]);
  // The sphere is a fixed layer in front of page 2: it stays whole while the camera flies into
  // it, then dissolves to reveal page 2, already in place underneath (a film-title hand-off).
  const stageOpacity = useTransform(p, [0, 0.62, 0.97], [1, 1, 0]);
  const stageVisibility = useTransform(p, (v) => (v >= 0.995 ? "hidden" : "visible"));
  const uiY = useTransform(p, [0, 0.35], [0, reduce ? 0 : 40]);

  const submit = (text) => {
    if (!text.trim()) return;
    setAsked(true);
    ask(text);
    setQ("");
  };
  const lastAi = [...log].reverse().find((m) => m.who === "ai");

  const enter = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16, filter: "blur(6px)" },
    animate: booted ? { opacity: 1, y: 0, filter: "blur(0px)" } : {},
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <section id="top" ref={wrap} className="relative h-[100dvh] overflow-hidden bg-bg" aria-label={`${NAME}, Omkar's portfolio assistant`}>
      {/* Sphere: fixed and in front during the hand-off; the UI below sits above it */}
      <motion.div style={{ opacity: stageOpacity, visibility: stageVisibility }} className="pointer-events-none fixed inset-0 z-30 bg-bg">
        <Suspense fallback={null}>
          {webgl ? (
            <Sphere key={skip ? "skip" : "boot"} progress={reduce ? null : p} boot={!skip} bootMs={BOOT_MS} reduce={!!reduce} onFail={onFail} className="h-full w-full" />
          ) : (
            <Sphere2D key={skip ? "skip" : "boot"} progress={reduce ? null : p} boot={!skip} bootMs={BOOT_MS} reduce={!!reduce} className="h-full w-full" />
          )}
        </Suspense>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_40%,transparent_45%,rgba(3,3,6,0.9)_100%)]" aria-hidden />
        {/* The page-2 room light already falls here, blue from the left and red from the right, so the
            gold sphere sits in the same space the portrait does. Kept to the edges, off the sphere. */}
        <div className="pointer-events-none absolute inset-0 mix-blend-screen bg-[radial-gradient(34%_75%_at_0%_55%,rgba(2,82,172,0.55),transparent_72%),radial-gradient(34%_75%_at_100%_48%,rgba(211,24,22,0.45),transparent_72%)]" aria-hidden />
        <motion.div style={{ opacity: uiOpacity }} className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-bg via-bg/80 to-transparent" aria-hidden />
      </motion.div>

      {/* Top bar */}
      <motion.header style={{ opacity: uiOpacity }} className="absolute inset-x-0 top-0 z-[35] px-5 md:px-8">
        <motion.div {...enter(0)} className="mx-auto flex h-16 max-w-[1400px] items-center justify-between md:h-20">
          {/* Same mark as the page-2 nav, so both screens read as one site */}
          <a href="#top" className="flex items-center gap-3" aria-label="Omkar Kale, home">
            <Monogram />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">{profile.name}</span>
          </a>
          <div className="flex items-center gap-2">
            {supported.tts && (
              <button
                onClick={() => setVoiceGender(voiceGender === "male" ? "female" : "male")}
                title={`Switch AI voice (currently ${voiceGender === "male" ? "Male" : "Female (Default)"}). Click to switch.`}
                aria-label={`Current AI assistant voice is ${voiceGender === "male" ? "Male" : "Female"}. Click to switch to ${voiceGender === "male" ? "Female" : "Male"}.`}
                className="group flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-xs text-fg/90 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.08] hover:text-fg active:scale-[0.98]"
              >
                <span
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    voiceGender === "male"
                      ? "bg-blue-glow shadow-[0_0_8px_#4dabf7]"
                      : "bg-accent shadow-[0_0_8px_#ff6b6b]"
                  }`}
                />
                <span className="text-muted group-hover:text-fg/80">Voice:</span>
                <span className="font-semibold text-fg tracking-tight">
                  {voiceGender === "male" ? "Male" : "Female"}
                </span>
              </button>
            )}
            {supported.tts && (
              <button
                onClick={() => setVoice(!kale.get().voiceOn)}
                aria-label={voiceOn ? `Mute ${NAME} voice` : `Turn on ${NAME} voice`}
                aria-pressed={voiceOn}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-fg/80 backdrop-blur-md transition hover:border-white/25 hover:text-fg active:scale-95"
              >
                {voiceOn ? <SpeakerHigh size={17} /> : <SpeakerSlash size={17} />}
              </button>
            )}
            <a
              href={profile.resume}
              download
              className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm text-fg/90 backdrop-blur-md transition hover:border-white/25 hover:text-fg active:scale-[0.98]"
            >
              <DownloadSimple size={16} /> Résumé
            </a>
          </div>
        </motion.div>
      </motion.header>

      {/* Bottom stage */}
      <motion.div style={{ opacity: uiOpacity, y: uiY }} className="absolute inset-x-0 bottom-0 z-[35] px-5 pb-6 md:px-8 md:pb-10">
        <div className="mx-auto grid max-w-[1400px] items-end gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          <div>
            <motion.p {...enter(0.05)} className="on-glow font-mono text-xs text-hud">
              {NAME}, Omkar's AI assistant
            </motion.p>
            <motion.h1 {...enter(0.12)} className="display mt-3 text-[clamp(3rem,6.6vw,6.75rem)] [@media(max-height:560px)]:text-5xl">
              Omkar Kale<span className="text-accent">.</span>
            </motion.h1>
            <motion.p {...enter(0.2)} className="on-glow mt-3 max-w-[52ch] text-base leading-relaxed text-fg md:text-lg [@media(max-height:560px)]:hidden">
              {/* Phones: one short line; the rest of the story is a scroll away. */}
              <span className="md:hidden">AI engineering student. Explainable deep learning research, AI agents in real software.</span>
              <span className="hidden md:inline">Final-year AI engineering student in Pune. I publish explainable deep learning research and ship AI agents inside real software.</span>
            </motion.p>
            <motion.ul {...enter(0.26)} className="mt-5 hidden max-w-[560px] grid-cols-3 gap-px overflow-hidden rounded-[14px] border border-white/15 bg-white/10 md:grid [@media(max-height:640px)]:hidden" aria-label="Highlights">
              {FACTS.map(([value, label]) => (
                <li key={label} className="bg-chrome/85 px-3 py-2.5 backdrop-blur-md md:px-4">
                  <p className="display text-2xl text-fg md:text-3xl">{value}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted md:text-xs">{label}</p>
                </li>
              ))}
            </motion.ul>
            <motion.p {...enter(0.3)} className="on-glow mt-5 text-sm text-fg/85 [@media(max-height:560px)]:hidden">Take a guided tour:</motion.p>
            <motion.div {...enter(0.34)} className="mt-2.5 flex flex-wrap gap-2.5">
              {PATHS.map(([id, label], i) => (
                <button
                  key={id}
                  onClick={() => startTour(id)}
                  className={`group flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition active:scale-[0.97] md:h-12 md:px-5 md:text-[15px] ${
                    i === 0
                      ? "bg-fg text-ink hover:bg-white"
                      : "border border-white/15 bg-white/[0.04] text-fg backdrop-blur-md hover:border-white/30 hover:bg-white/[0.08]"
                  }`}
                >
                  {label}
                  <ArrowRight size={16} className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
                </button>
              ))}
            </motion.div>
          </div>

          {/* Ask box */}
          <motion.form
            {...enter(0.38)}
            onSubmit={(e) => {
              e.preventDefault();
              submit(q);
            }}
            className="hidden w-full rounded-[20px] border border-white/15 bg-chrome/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl md:block md:p-5 [@media(max-height:640px)]:hidden"
          >
            <label htmlFor="landing-ask" className="text-sm font-medium text-fg/90">
              Ask {NAME} anything
            </label>
            <div className="mt-3 flex items-center gap-2">
              <input
                id="landing-ask"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. What did he build with AI agents?"
                autoComplete="off"
                className="h-12 min-w-0 flex-1 rounded-full border border-white/15 bg-black/30 px-4 text-[15px] text-fg placeholder:text-muted focus:border-hud/70 focus:outline-none focus:ring-2 focus:ring-hud/20"
              />
              <button type="submit" aria-label="Ask" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-hud text-ink transition hover:brightness-110 active:scale-95">
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
            <div className="mt-3 min-h-[2.25rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                {asked && lastAi ? (
                  <motion.p key={log.length} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm leading-relaxed text-fg/90">
                    <Typed text={lastAi.text} speed={14} />
                  </motion.p>
                ) : (
                  <motion.div key="quick" initial={false} exit={{ opacity: 0 }} className="flex flex-wrap gap-2">
                    {QUICK.map((s) => (
                      <button key={s} type="button" onClick={() => submit(s)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-muted transition hover:border-white/25 hover:text-fg">
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.form>
        </div>
      </motion.div>

      {/* Boot progress + skip */}
      <AnimatePresence>
        {!booted && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-x-0 bottom-0 z-[36]">
            <button onClick={() => (setSkip(true), setBootDone(true))} className="absolute bottom-5 right-5 rounded-full px-3 py-1.5 text-xs text-muted transition hover:text-fg md:right-8">
              Skip intro
            </button>
            <motion.div className="h-px origin-left bg-hud/70" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: BOOT_MS / 1000, ease: [0.4, 0, 0.2, 1] }} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
