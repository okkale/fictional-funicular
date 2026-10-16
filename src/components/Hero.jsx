import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
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
  the headline on the dark left side (the Sharkfold composition). Phones get a portrait crop with
  the copy over a bottom fade. The photo settles in with a slow push-in and drifts on scroll.
*/
export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -40, reduce ? 0 : 60]);

  return (
    <section id="hero" ref={ref} className="hero relative min-h-[100dvh] overflow-hidden bg-bg px-4 md:px-8 lg:h-[100dvh]">
      {/* Portrait: a tall photo on the right (full width on phones) whose dark edges melt into the page */}
      <motion.div
        style={{ y: photoY }}
        className="absolute inset-x-0 top-14 h-[64dvh] will-change-transform md:bottom-[6dvh] md:left-auto md:right-[calc(max(1rem,(100vw-1400px)/2)+6vw)] md:top-[10dvh] md:h-auto md:w-[min(50%,calc(84dvh*1077/1460))]"
        aria-hidden
      >
        <motion.img
          src="/me-portrait.jpg"
          srcSet="/me-portrait.webp"
          alt=""
          className="hero-portrait h-full w-full origin-top object-cover object-[50%_8%] md:object-top"
          initial={reduce ? false : { opacity: 0, scale: 1.06 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.8, ease: EASE }}
        />
        {/* Phones: the photo ends in a soft fade above the copy */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/70 to-transparent md:hidden" />
      </motion.div>

      {/* Fades: into the page at the top and bottom, and a dark field behind the text */}
      <div className="pointer-events-none absolute inset-x-0 top-14 h-12 bg-gradient-to-b from-bg to-transparent md:top-[7dvh]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t from-bg via-bg/40 to-transparent md:block" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-bg/90 via-bg/50 to-transparent md:block" aria-hidden />

      <div className="relative z-[3] mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-end pb-14 pt-28 md:justify-center lg:h-full lg:min-h-0 lg:pb-[6dvh] lg:pt-[12dvh]">
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
