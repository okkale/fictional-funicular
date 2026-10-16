import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, Pause, Play, X } from "@phosphor-icons/react";
import Orb from "./Orb";
import Typed from "./Typed";
import { NAME, TOURS } from "./intents";
import { nextStep, prevStep, stopTour, togglePlay, useKale } from "./store";
import { EASE } from "../components/ui";

const NAMES = { recruiter: "Recruiter tour", engineer: "Engineer tour", explore: "Quick tour" };

/*
  Guided tour caption: one slim glass bar at the bottom of the screen. Title of the current stop,
  Kyle's line as a caption, and playback controls. Rises from the bottom and leaves the same way.
*/
export default function TourBar() {
  const { tour, speaking } = useKale();
  const reduce = useReducedMotion();
  if (!tour) return null;
  const steps = TOURS[tour.id];
  const step = steps[tour.index];
  const n = steps.length;
  const btn = "grid h-9 w-9 place-items-center rounded-full text-fg/85 transition hover:bg-white/[0.08] hover:text-fg active:scale-95 disabled:pointer-events-none disabled:opacity-30";

  return (
    <motion.aside
      role="region"
      data-tour-bar
      aria-label={`${NAME}, ${NAMES[tour.id]}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40, filter: "blur(10px)" }}
      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[620px] overflow-hidden rounded-[18px] border border-white/10 bg-chrome/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl md:bottom-4"
    >
      {/* Progress: a single growing hairline */}
      <motion.div
        aria-hidden
        className="absolute left-0 top-0 h-px bg-hud"
        initial={false}
        animate={{ width: `${((tour.index + 1) / n) * 100}%` }}
        transition={{ type: "spring", bounce: 0, duration: 0.6 }}
      />

      <div className="flex items-center gap-3 px-3 pb-1 pt-2.5 md:px-4">
        <span className="block h-8 w-8 shrink-0" aria-hidden>
          <Orb compact tint={speaking ? "speaking" : "idle"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            {NAMES[tour.id]} · {tour.index + 1} of {n}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={tour.index}
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="truncate text-[15px] font-semibold tracking-[-0.01em] text-fg"
            >
              {step.title}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center">
          <button onClick={prevStep} disabled={tour.index === 0} aria-label="Previous stop" className={btn}>
            <CaretLeft size={16} weight="bold" />
          </button>
          <button onClick={togglePlay} aria-label={tour.playing ? "Pause tour" : "Resume tour"} className={btn}>
            {tour.playing ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
          </button>
          <button onClick={nextStep} aria-label={tour.index === n - 1 ? "Finish tour" : "Next stop"} className={btn}>
            <CaretRight size={16} weight="bold" />
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
          <button onClick={stopTour} aria-label="End tour" className={btn}>
            <X size={15} />
          </button>
        </div>
      </div>

      <p className="min-h-[2.5rem] px-4 pb-3 text-[13px] leading-snug text-fg/90 md:pl-[3.5rem]" aria-live="polite">
        <Typed key={tour.index} text={step.line} speed={16} />
      </p>
    </motion.aside>
  );
}
