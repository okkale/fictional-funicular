import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "../perf";
import { ArrowDownRight, DownloadSimple } from "@phosphor-icons/react";
import { EASE, Magnetic, Scramble } from "./ui";
import { profile } from "../data";

// Lines rise out of a mask when the headline scrolls into view. The trigger lives on the <h2>:
// the lines themselves start outside their clipping box, so they can never be "in view".
const line = {
  hidden: { y: "105%" },
  shown: (i) => ({ y: "0%", transition: { duration: 1.1, delay: 0.05 + i * 0.1, ease: EASE } }),
};

/*
  Page 2. The portrait is the backdrop: Omkar on the right under the blue / red striped light,
  the headline on the dark left side (the Sharkfold composition). Phones get a small, crisp round
  avatar aligned with the copy, so the text never covers the face. The photo settles in with a slow push-in and drifts on scroll.
*/
export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -40, reduce ? 0 : 60]);

  return (
    <section id="hero" ref={ref} className="hero relative overflow-hidden bg-bg px-4 pt-16 md:min-h-[100dvh] md:px-8 md:pt-0 lg:h-[100dvh]">
      {/* Portrait: a tall photo on the right whose dark edges melt into the page. Phones: a round
          avatar in the flow, above the copy. */}
      <motion.div
        style={{ y: photoY }}
        className="hero-photo relative mt-6 h-28 w-28 overflow-hidden rounded-full bg-surface ring-1 ring-white/15 shadow-[0_10px_40px_-12px_rgba(2,82,172,0.6)] will-change-transform md:absolute md:mt-0 md:overflow-visible md:rounded-none md:bg-transparent md:shadow-none md:ring-0 md:bottom-[6dvh] md:right-[calc(max(1rem,(100vw-1400px)/2)+6vw)] md:top-[10dvh] md:mx-0 md:aspect-auto md:h-auto md:w-[min(50%,calc(84dvh*1077/1460))]"
        aria-hidden
      >
        <motion.img
          src="/me-portrait.jpg"
          srcSet="/me-portrait.webp"
          alt="Omkar Kale"
          className="hero-portrait -ml-[15%] -mt-[9%] h-auto w-[130%] max-w-none origin-top md:m-0 md:h-full md:w-full md:max-w-full md:object-cover md:object-top"
          initial={reduce ? false : { opacity: 0, scale: 1.06 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }} /* the phone crop only ever shows ~25% of the photo */
          transition={{ duration: 1.8, ease: EASE }}
        />
      </motion.div>

      {/* Fades: into the page at the top and bottom, and a dark field behind the text */}
      <div className="pointer-events-none absolute inset-x-0 top-14 hidden h-12 bg-gradient-to-b from-bg to-transparent md:top-[7dvh] md:block" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t from-bg via-bg/40 to-transparent md:block" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-bg/90 via-bg/50 to-transparent md:block" aria-hidden />

      <div className="relative z-[3] mx-auto mt-5 flex max-w-[1400px] flex-col pb-14 md:mt-0 md:min-h-[100dvh] md:justify-center md:pt-28 lg:h-full lg:min-h-0 lg:pb-[6dvh] lg:pt-[12dvh]">
        <div className="max-w-[640px]">
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 rounded-full border border-line bg-bg/50 py-1.5 pl-2.5 pr-4 font-mono text-xs text-muted backdrop-blur"
          >
            <span className="live-dot h-2 w-2 rounded-full bg-accent" aria-hidden />
            Final-year AI student, open to ML / AI engineer roles
          </motion.p>

          <motion.h2
            className="display mt-6 text-[clamp(3.2rem,12vw,6rem)] md:mt-8 lg:mt-[3.5dvh] lg:text-[clamp(3.4rem,min(6.6vw,14dvh),9rem)]"
            initial={reduce ? false : "hidden"}
            whileInView="shown"
            viewport={{ once: true, amount: 0.4 }}
          >
            <span className="block overflow-hidden">
              <motion.span className="block" variants={line} custom={0}>
                From <span className="text-muted">model</span>
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span className="block" variants={line} custom={1}>
                to <span className="text-muted">product</span>
                <span className="text-accent">.</span>
              </motion.span>
            </span>
          </motion.h2>

          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.9, ease: EASE }}>
            <p className="mt-6 max-w-[30ch] text-xl leading-snug md:mt-8 md:text-3xl lg:mt-[3.5dvh] lg:text-[clamp(1.25rem,3.2dvh,1.875rem)]">
              Building at the intersection of <span className="text-blue-glow">deep learning</span>, <span className="text-accent-fg">explainability</span> and real software.
            </p>
            <p className="mt-4 font-mono text-sm text-muted">
              {profile.name} / <Scramble words={["explainable vision", "computer vision", "speech pipelines", "agentic software"]} className="text-hud" />
            </p>
            <div className="mt-8 flex flex-wrap gap-3 lg:mt-[4dvh]">
              <Magnetic>
                <a href="#projects" className="group flex h-14 items-center gap-2.5 rounded-full bg-fg px-7 font-medium text-ink transition hover:bg-white active:scale-[0.98]">
                  View work
                  <ArrowDownRight size={18} weight="bold" className="transition-transform duration-500 ease-out-expo group-hover:-rotate-45" />
                </a>
              </Magnetic>
              <Magnetic strength={0.2}>
                <a href={profile.resume} download className="flex h-14 items-center gap-2.5 rounded-full border border-line bg-bg/50 px-7 font-medium backdrop-blur transition hover:border-blue-glow hover:bg-surface-2 active:scale-[0.98]">
                  <DownloadSimple size={18} /> Résumé
                </a>
              </Magnetic>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
