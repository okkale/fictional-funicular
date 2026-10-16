import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import { Microphone, PaperPlaneRight, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import Orb from "./Orb";
import Typed from "./Typed";
import { NAME, SUGGEST } from "./intents";
import { ask, kale, setVoice, useKale, warmModel } from "./store";
import TourBar from "./TourBar";
import { listen, supported } from "./voice";
import { EASE } from "../components/ui";

/* Corner dock: K.A.L.E. shrinks here once the visitor leaves the landing HUD. Ctrl/⌘ K toggles. */
export default function Kale() {
  const { open, log, voiceOn, speaking, listening, tour, slm, thinking } = useKale();
  const [shown, setShown] = useState(false);
  const [input, setInput] = useState("");
  const stopRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const { scrollY } = useScroll();
  // Out of the way on the landing, and again once Contact takes over: it would sit on the
  // social links and footer, and Contact already says how to reach him. Ctrl/⌘ K still opens it.
  useMotionValueEvent(scrollY, "change", (y) => {
    const contact = document.getElementById("contact");
    const atContact = contact && contact.getBoundingClientRect().top < window.innerHeight * 0.6;
    setShown(y > window.innerHeight * 0.8 && !atContact);
  });

  const setOpen = (v) => kale.set({ open: typeof v === "function" ? v(kale.get().open) : v });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open && kale.get().log.length === 0) {
      kale.set({ log: [{ who: "ai", text: `${NAME} online. Ask about Omkar's research, projects, the ERP, or how to hire him.` }] });
    }
    if (open) {
      warmModel();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  const send = (text) => {
    if (!text.trim()) return;
    ask(text);
    setInput("");
  };

  const toggleListen = () => {
    if (listening) {
      stopRef.current?.();
      return;
    }
    kale.set({ listening: true });
    stopRef.current = listen(send, () => kale.set({ listening: false }));
  };

  const tint = listening ? "listening" : speaking ? "speaking" : "idle";
  const busy = thinking || speaking || listening;
  const status = listening
    ? "Listening…"
    : thinking
      ? "Thinking…"
      : speaking
        ? "Speaking…"
        : slm === "ready"
          ? "Online · on-device model"
          : slm === "loading"
            ? "Loading on-device model…"
            : "Online · keyword mode";
  const visible = (shown || open) && !tour; // the tour bar carries its own controls
  const lastAi = [...log].reverse().find((m) => m.who === "ai");
  const subtitle = !open && !tour && speaking && lastAi;

  return (
    <>
      <AnimatePresence>{tour && <TourBar key="tour" />}</AnimatePresence>

      {/* Subtitles: what K.A.L.E. is saying while the chat is closed. */}
      <AnimatePresence mode="wait">
        {subtitle && (
          <motion.p
            key={log.length}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: EASE }}
            aria-live="polite"
            className="hud-panel fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-2rem))] bg-chrome/85 px-4 py-3 font-mono text-[13px] leading-relaxed text-fg"
          >
            <span className="hud-text mr-2">&gt;</span>
            <Typed text={lastAi.text} speed={18} />
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2"
          >
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? `Close ${NAME}` : `Open ${NAME} assistant`}
              aria-expanded={open}
              title={`Ask ${NAME} (Ctrl K)`}
              className={`group flex h-16 items-center gap-3 rounded-full border border-[rgba(255,182,72,0.35)] bg-chrome/80 p-1.5 backdrop-blur-xl transition hover:border-hud active:scale-[0.97] lg:hover:pr-5 lg:focus-visible:pr-5 ${speaking ? "lg:pr-5" : ""}`}
            >
              <span className="block h-[52px] w-[52px]">
                <Orb compact tint={tint} />
              </span>
              {/* Label only on hover, focus or while speaking: the resting dock is just the orb, so it covers less */}
              <span className={`hidden text-left lg:group-hover:block lg:group-focus-visible:block ${speaking ? "lg:block" : ""}`}>
                <span className="hud-text block font-mono text-xs tracking-[0.2em]">{NAME}</span>
                <span className="block font-mono text-[10px] text-muted">{speaking ? "speaking…" : "Ctrl K to ask"}</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={`${NAME} assistant`}
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.97, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: EASE }}
            className="hud-panel fixed bottom-24 right-4 z-50 flex max-h-[min(620px,calc(100dvh-8rem))] w-[min(420px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden bg-chrome/90 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center gap-3 border-b border-[rgba(255,182,72,0.15)] px-4 py-3">
              <span className="relative block h-11 w-11 shrink-0 rounded-full border border-[rgba(255,182,72,0.35)] bg-ink/60">
                <Orb compact tint={tint} />
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-chrome ${busy ? "bg-accent" : slm === "ready" ? "bg-hud" : "animate-pulse bg-muted"}`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="hud-text font-mono text-sm tracking-[0.2em]" title="Knowledge Assistant for Learning & Engineering">{NAME}</p>
                <p className="truncate font-mono text-[11px] text-muted" aria-live="polite">{status}</p>
              </div>
              <div className="flex items-center gap-1">
                {supported.tts && (
                  <button onClick={() => setVoice(!voiceOn)} aria-label={voiceOn ? "Mute voice replies" : "Turn on voice replies"} className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-hud">
                    {voiceOn ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
              {log.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={m.who === "you" ? "ml-10 border border-[rgba(255,182,72,0.3)] bg-[rgba(255,182,72,0.1)] px-4 py-2.5 text-sm text-fg" : "mr-6 font-mono text-[13px] leading-relaxed text-fg/90"}
                >
                  {m.who === "ai" ? (
                    <>
                      <span className="hud-text mr-2">&gt;</span>
                      {i === log.length - 1 ? <Typed text={m.text} /> : m.text}
                    </>
                  ) : (
                    m.text
                  )}
                </motion.div>
              ))}
              {thinking && <p className="font-mono text-[13px] text-muted"><span className="hud-text mr-2">&gt;</span>thinking…</p>}
            </div>

            <div className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
              {SUGGEST.map((s) => (
                <button key={s} onClick={() => send(s)} className="shrink-0 border border-line px-3 py-1.5 font-mono text-[11px] text-muted transition hover:border-hud hover:text-hud">
                  {s}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-[rgba(255,182,72,0.15)] p-3">
              <label htmlFor="kale-input" className="sr-only">Ask {NAME}</label>
              <input
                id="kale-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening…" : "Ask about research, projects, hiring"}
                className="h-11 flex-1 border border-line bg-surface px-4 font-mono text-[13px] text-fg placeholder:text-muted focus:border-hud focus:outline-none"
                autoComplete="off"
              />
              {supported.stt && (
                <button type="button" onClick={toggleListen} aria-label={listening ? "Stop listening" : "Speak a question"} className={`grid h-11 w-11 place-items-center border transition ${listening ? "border-accent bg-accent text-ink" : "border-line text-muted hover:text-hud"}`}>
                  <Microphone size={18} />
                </button>
              )}
              <button type="submit" aria-label="Send" className="grid h-11 w-11 place-items-center bg-hud text-ink transition active:scale-95">
                <PaperPlaneRight size={18} weight="fill" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
