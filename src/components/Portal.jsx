import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "../perf";
import { Brain, ChartLineUp, Robot, Waveform } from "@phosphor-icons/react";
import { Eyebrow, Reveal, Tilt } from "./ui";

/* "What I build": the Sharkfold neon ring portal with glass cards floating around it. */
const CARDS = [
  { Icon: Brain, title: "Explainable vision", body: "CNNs that show where they look, checked with Grad-CAM, LIME and SHAP.", pos: "lg:left-0 lg:top-[8%]" },
  { Icon: ChartLineUp, title: "Recommenders", body: "Matching travellers to cultural trips, bookings and QR tickets.", pos: "lg:right-0 lg:top-[8%]" },
  { Icon: Waveform, title: "Speech & NLP", body: "Hour-long audio transcribed and summarised into what matters.", pos: "lg:left-[4%] lg:bottom-[6%]" },
  { Icon: Robot, title: "Agentic software", body: "LLM agents inside ERP, CRM and web apps that move work forward.", pos: "lg:right-[4%] lg:bottom-[6%]" },
];

function Ring() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="portal-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3b3b" />
          <stop offset="0.45" stopColor="#591e28" />
          <stop offset="0.6" stopColor="#0252ac" />
          <stop offset="1" stopColor="#3b8bff" />
        </linearGradient>
        <filter id="portal-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <g>
        <circle cx="200" cy="200" r="160" fill="none" stroke="url(#portal-g)" strokeWidth="22" filter="url(#portal-blur)" opacity="0.9" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="url(#portal-g)" strokeWidth="4" />
        <circle cx="200" cy="200" r="148" fill="none" stroke="url(#portal-g)" strokeWidth="1" strokeDasharray="2 10" opacity="0.7" />
      </g>
    </svg>
  );
}

export default function Portal() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  // The ring turns and opens up as the section scrolls through the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -60, reduce ? 0 : 120]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [reduce ? 1 : 0.8, 1]);
  return (
    <section id="build" ref={ref} className="relative overflow-hidden px-4 py-28 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="relative lg:min-h-[min(760px,calc(100dvh-150px))]">
          <div className="relative mx-auto aspect-square w-[min(88vw,620px)] lg:absolute lg:left-1/2 lg:top-1/2 lg:w-[min(620px,calc(100dvh-210px))] lg:-translate-x-1/2 lg:-translate-y-1/2">
            <motion.div style={{ rotate, scale }} className="h-full w-full will-change-transform">
              <Ring />
            </motion.div>
            <div className="absolute inset-0 grid place-items-center p-[22%] text-center">
              <Reveal>
                <Eyebrow className="justify-center">WHAT I BUILD</Eyebrow>
                <h2 className="display mt-3 text-5xl md:text-7xl">
                  Models <span className="text-muted">that ship</span>
                </h2>
                <p className="mx-auto mt-4 max-w-[30ch] text-sm leading-relaxed text-muted md:text-base">
                  Research-grade deep learning, carried all the way into software people use.
                </p>
              </Reveal>
            </div>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-0 lg:block">
            {CARDS.map(({ Icon, title, body, pos }, i) => (
              <li key={title} className={`lg:absolute lg:w-[300px] ${pos}`}>
                <Reveal delay={0.1 + i * 0.08}>
                  <Tilt>
                  <div className="glass rounded-[18px] p-6 shadow-[0_20px_60px_-20px_rgba(2,82,172,0.5)] transition-transform duration-500 ease-out-expo hover:-translate-y-1">
                    <Icon size={26} className={i % 2 ? "text-accent-fg" : "text-blue-glow"} />
                    <h3 className="display mt-4 text-3xl">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  </div>
                  </Tilt>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
