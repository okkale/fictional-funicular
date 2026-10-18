import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import { List, X, DownloadSimple, SpeakerHigh } from "@phosphor-icons/react";
import { erpPipeline, profile } from "../data";
import { useKale, setVoiceGender } from "../kale/store";
import { EASE } from "./ui";

const LINKS = [
  ["About", "#hero"],
  ["Expertise", "#expertise"],
  ["Projects", "#projects"],
  ...(erpPipeline.length ? [["Model Lab", "#lab"]] : []),
  ["Experience", "#experience"],
  ["Contact", "#contact"],
];

export function Monogram({ className = "" }) {
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-[10px] bg-fg text-bg text-[15px] font-bold tracking-[-0.06em] ${className}`}>
      <span>
        OK<span className="text-accent">.</span>
      </span>
    </span>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true); // revealed once the visitor leaves the Kyle landing
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const { tour, voiceGender } = useKale(); // tours own the screen: keep the nav out of the way

  const isFemale = voiceGender !== "male"; // default to female

  const toggleVoice = () => {
    setVoiceGender(isFemale ? "male" : "female");
  };

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden((y > prev && y > 400 && !open) || y < window.innerHeight * 0.9);
    setScrolled(y > 24);
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <motion.div className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-blue-glow to-accent" style={{ scaleX: scrollYProgress }} />
      <motion.header
        animate={{ y: hidden || tour ? "-120%" : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="fixed inset-x-0 top-0 z-40 px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:px-6"
      >
        <nav
          className={`mx-auto flex h-14 max-w-[1280px] items-center justify-between rounded-full border px-2 pl-2 transition-colors duration-500 ${
            scrolled ? "border-line bg-chrome/75 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(2,82,172,0.35)]" : "border-transparent"
          }`}
        >
          <a href="#top" className="flex items-center gap-3" aria-label="Omkar Kale, home">
            <Monogram />
            <span className="hidden text-[15px] font-semibold tracking-[-0.02em] sm:block">{profile.name}</span>
          </a>
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <a href={href} className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            {/* AI Voice Switcher on Navbar: Female (default) / Male */}
            <button
              onClick={toggleVoice}
              title={`Switch AI voice (currently ${isFemale ? "Female (Default)" : "Male"}). Click to switch to ${isFemale ? "Male" : "Female"}.`}
              aria-label={`Current AI assistant voice is ${isFemale ? "Female" : "Male"}. Click to switch to ${isFemale ? "Male" : "Female"}.`}
              className="group flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 text-xs text-fg/90 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-fg active:scale-[0.98]"
            >
              <span
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  isFemale
                    ? "bg-accent shadow-[0_0_8px_#ff6b6b]"
                    : "bg-blue-glow shadow-[0_0_8px_#4dabf7]"
                }`}
              />
              <span className="text-muted group-hover:text-fg/80">Voice:</span>
              <span className="font-semibold text-fg tracking-tight">
                {isFemale ? "Female" : "Male"}
              </span>
            </button>

            <a
              href={profile.resume}
              download
              className="hidden h-9 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm text-fg/90 transition hover:border-white/25 hover:text-fg active:scale-[0.98] sm:flex"
            >
              <DownloadSimple size={16} /> Résumé
            </a>
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2 lg:hidden">
              <List size={20} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col overscroll-contain bg-bg/95 px-6 pb-[env(safe-area-inset-bottom,0px)] pt-[calc(1.5rem+env(safe-area-inset-top,0px))] backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between">
              <Monogram />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2">
                <X size={20} />
              </button>
            </div>
            <ul className="mt-8 space-y-1">
              {[...LINKS, ["Résumé", profile.resume]].map(([label, href], i) => (
                <motion.li key={href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, ease: EASE, duration: 0.6 }}>
                  <a href={href} onClick={() => setOpen(false)} className="display block py-2 text-5xl">
                    {label}
                  </a>
                </motion.li>
              ))}
            </ul>

            {/* Mobile Drawer Voice Switcher */}
            <div className="mt-auto mb-6 rounded-2xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs uppercase tracking-wider text-muted font-semibold">AI Assistant Voice (Tour & Chatbot)</span>
                <span className="text-xs font-medium text-fg/80">{isFemale ? "Female (Default)" : "Male"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceGender("female")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                    isFemale
                      ? "border border-accent/50 bg-accent/15 text-accent shadow-sm"
                      : "border border-white/10 bg-white/[0.03] text-muted hover:text-fg"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Female (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGender("male")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                    !isFemale
                      ? "border border-blue-glow/50 bg-blue-glow/15 text-blue-glow shadow-sm"
                      : "border border-white/10 bg-white/[0.03] text-muted hover:text-fg"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-glow" />
                  Male
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
