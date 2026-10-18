import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import {
  Microphone,
  PaperPlaneRight,
  SpeakerHigh,
  SpeakerSlash,
  X,
  SlidersHorizontal,
  Brain,
  Check,
  FloppyDisk,
  Trash,
  PencilSimple,
  Sparkle,
} from "@phosphor-icons/react";
import Orb from "./Orb";
import Typed from "./Typed";
<<<<<<< Updated upstream
import { NAME, SUGGEST } from "./intents";
<<<<<<< HEAD
import { ask, kale, setVoice, useKale } from "./store";
=======
import { NAME } from "./intents";
import {
  ask,
  kale,
  setVoice,
  setVoiceGender,
  useKale,
  warmModel,
  alterAnswer,
  clearMemory,
  getMemoryStats,
  toggleLearning,
} from "./store";
import { subscribeMemory } from "./memory";
>>>>>>> Stashed changes
=======
import { ask, kale, setVoice, useKale, warmModel } from "./store";
>>>>>>> origin/kale-voice-slm
import TourBar from "./TourBar";
import { listen, supported } from "./voice";
import { EASE } from "../components/ui";

<<<<<<< HEAD
<<<<<<< Updated upstream
/* Corner dock: K.A.L.E. shrinks here once the visitor leaves the landing HUD. Ctrl/⌘ K toggles. */
export default function Kale() {
  const { open, log, voiceOn, speaking, listening, tour } = useKale();
=======
const REAL_WORLD_SUGGESTIONS = [
  "Who wrote the pneumonia paper?",
  "TriHub ERP stack & roles",
  "Critical weeks in risk model",
  "Why should I hire Omkar?",
  "What did he do at NMIET?",
  "What is Kyle's architecture?",
  "Who am I?",
  "Download résumé",
];

const AVAILABLE_ACTIONS = [
  { value: "", label: "No Action" },
  { value: "scroll:#projects", label: "Scroll to Projects (#projects)" },
  { value: "scroll:#lab", label: "Scroll to Model Lab / ERP (#lab)" },
  { value: "scroll:#expertise", label: "Scroll to Skills (#expertise)" },
  { value: "scroll:#experience", label: "Scroll to Experience (#experience)" },
  { value: "scroll:#metrics", label: "Scroll to Metrics (#metrics)" },
  { value: "scroll:#contact", label: "Scroll to Contact (#contact)" },
  { value: "scroll:#hero", label: "Scroll to Hero (#hero)" },
  { value: "download", label: "Download Résumé (PDF)" },
  { value: "open:github", label: "Open GitHub Profile" },
  { value: "open:linkedin", label: "Open LinkedIn Profile" },
];

/* Corner dock: Kyle shrinks here once the visitor leaves the landing HUD. Ctrl/⌘ K toggles. */
export default function Kale() {
  const { open, log, voiceOn, voiceGender, speaking, listening, tour, slm, thinking } = useKale();
>>>>>>> Stashed changes
=======
/* Corner dock: Kyle shrinks here once the visitor leaves the landing HUD. Ctrl/⌘ K toggles. */
export default function Kale() {
  const { open, log, voiceOn, speaking, listening, tour, slm, thinking } = useKale();
>>>>>>> origin/kale-voice-slm
  const [shown, setShown] = useState(false);
  const [input, setInput] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [editAction, setEditAction] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [memStats, setMemStats] = useState(getMemoryStats);

  const stopRef = useRef(null);
  const listRef = useRef(null);
  const chipsRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const contact = document.getElementById("contact");
    const atContact = contact && contact.getBoundingClientRect().top < window.innerHeight * 0.6;
    setShown(y > window.innerHeight * 0.8 && !atContact);
  });

  const setOpen = (v) => kale.set({ open: typeof v === "function" ? v(kale.get().open) : v });

  useEffect(() => {
    return subscribeMemory((updated) => setMemStats(updated));
  }, []);

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
      kale.set({
        log: [
          {
            who: "ai",
            text: `${NAME} online. Ask about Omkar's research, projects, the ERP, or how to hire him. I also self-learn from our conversation.`,
          },
        ],
      });
    }
    if (open) {
      warmModel();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [log, editingIndex]);

  // Isolate mouse-wheel scrolling: scroll chips horizontally when hovering over quick questions, and conversation log vertically otherwise
  useEffect(() => {
    const el = dialogRef.current;
    if (!open || !el) return;

    const onWheel = (e) => {
      const chipsEl = chipsRef.current;
      const isOverChips = chipsEl && (chipsEl === e.target || chipsEl.contains(e.target));

      if (isOverChips) {
        // When mouse pointer is over quick questions, scroll horizontally with mouse wheel
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        chipsEl.scrollLeft += delta;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (listRef.current) {
        listRef.current.scrollTop += e.deltaY;
      }
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  // Click & drag horizontal scrolling for quick question chips
  const onChipsMouseDown = (e) => {
    const el = chipsRef.current;
    if (!el) return;
    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;
    let isDown = true;

    const onMouseMove = (moveEvent) => {
      if (!isDown) return;
      moveEvent.preventDefault();
      const x = moveEvent.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX);
    };

    const onMouseUp = () => {
      isDown = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

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

  const startEdit = (idx, message) => {
    setEditingIndex(idx);
    setEditText(message.text);
    const act = message.meta?.action;
    if (act?.type === "scroll") setEditAction(`scroll:${act.target}`);
    else if (act?.type === "open") setEditAction(act.target.includes("github") ? "open:github" : "open:linkedin");
    else if (act?.type === "download") setEditAction("download");
    else setEditAction("");
  };

  const saveEdit = (message) => {
    const q = message.meta?.rawQuestion || log[editingIndex - 1]?.text;
    if (!q) {
      showToast("Cannot alter without original question context.");
      return;
    }
    let parsedAction = null;
    if (editAction.startsWith("scroll:")) parsedAction = { type: "scroll", target: editAction.slice(7) };
    else if (editAction === "download") parsedAction = { type: "download" };
    else if (editAction === "open:github") parsedAction = { type: "open", target: "https://github.com/okkale" };
    else if (editAction === "open:linkedin") parsedAction = { type: "open", target: "https://www.linkedin.com/in/omkar-kale-391712298" };

    alterAnswer(q, editText, parsedAction);
    setEditingIndex(null);
    showToast("✓ Learned! Kyle will use this custom response going forward.");
  };

  const copyCorpusCode = (message) => {
    const q = message.meta?.rawQuestion || log[editingIndex - 1]?.text || "custom query";
    const code = `    ([${JSON.stringify(q.toLowerCase())}],\n     ${JSON.stringify(editText)},\n     ${JSON.stringify(editAction)}),`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      showToast("✓ Copied python tuple to clipboard for corpus.py!");
    }
  };

  const tint = listening ? "listening" : speaking ? "speaking" : "idle";
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
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
>>>>>>> origin/kale-voice-slm
  const visible = (shown || open) && !tour; // the tour bar carries its own controls
=======
  const busy = thinking || speaking || listening;
  const status = listening
    ? "Listening…"
    : thinking
      ? "Thinking…"
      : speaking
        ? "Speaking…"
        : "Online";
  const visible = (shown || open) && !tour;
>>>>>>> Stashed changes
  const lastAi = [...log].reverse().find((m) => m.who === "ai");
  const subtitle = !open && !tour && speaking && lastAi;

  return (
    <>
      <AnimatePresence>{tour && <TourBar key="tour" />}</AnimatePresence>

      {/* Subtitles: what Kyle is saying while the chat is closed. */}
      <AnimatePresence mode="wait">
        {subtitle && (
          <motion.p
            key={log.length}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: EASE }}
            aria-live="polite"
            className="hud-panel fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-50 w-[min(380px,calc(100vw-2rem))] bg-chrome/85 px-4 py-3 font-mono text-[13px] leading-relaxed text-fg"
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
            className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-5 z-50 flex items-center gap-2"
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
            ref={dialogRef}
            role="dialog"
            aria-label={`${NAME} assistant`}
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.97, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: EASE }}
<<<<<<< HEAD
<<<<<<< Updated upstream
            className="hud-panel fixed bottom-24 right-4 z-50 flex max-h-[min(620px,calc(100dvh-8rem))] w-[min(420px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden bg-chrome/90 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)]"
=======
            className="hud-panel fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-50 flex max-h-[min(620px,calc(100dvh-8rem))] w-[min(420px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden bg-chrome/90 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)]"
>>>>>>> origin/kale-voice-slm
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
                <p className="hud-text font-mono text-sm tracking-[0.2em]">{NAME}</p>
<<<<<<< HEAD
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Knowledge Assistant for Learning & Engineering</p>
=======
            className="hud-panel fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-50 flex max-h-[min(640px,calc(100dvh-7.5rem))] w-[min(450px,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden bg-chrome/95 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.85)] border border-[rgba(255,182,72,0.25)] overscroll-contain"
          >
            {/* Top Bar */}
            <div className="flex items-center gap-3 border-b border-[rgba(255,182,72,0.15)] px-4 py-3">
              <span className="relative block h-11 w-11 shrink-0 rounded-full border border-[rgba(255,182,72,0.35)] bg-ink/60">
                <Orb compact tint={tint} />
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-chrome ${busy ? "bg-accent" : "bg-hud"}`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="hud-text font-mono text-sm tracking-[0.2em]">{NAME}</p>
                <p className="truncate font-mono text-[11px] text-muted" aria-live="polite">
                  {status}
                </p>
>>>>>>> Stashed changes
=======
                <p className="truncate font-mono text-[11px] text-muted" aria-live="polite">{status}</p>
>>>>>>> origin/kale-voice-slm
              </div>
              <div className="flex items-center gap-1">
                {/* SLM Inspector & Memory Studio toggle */}
                <button
                  onClick={() => setInspectorOpen((v) => !v)}
                  aria-label="Toggle SLM Inspector and Learning Studio"
                  title="SLM Telemetry & Memory Studio"
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${
                    inspectorOpen
                      ? "bg-hud text-ink font-bold shadow-[0_0_12px_rgba(255,182,72,0.5)]"
                      : "text-muted hover:bg-surface-2 hover:text-hud"
                  }`}
                >
                  <SlidersHorizontal size={16} />
                </button>
                {supported.tts && (
                  <button
                    onClick={() => setVoiceGender(voiceGender === "male" ? "female" : "male")}
                    title={`Voice: ${voiceGender === "male" ? "Male" : "Female (Default)"}. Click to toggle.`}
                    aria-label={`Toggle AI voice. Currently ${voiceGender === "male" ? "Male" : "Female"}.`}
                    className="flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 text-[11px] font-medium text-muted transition hover:border-white/20 hover:text-fg"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors ${voiceGender === "male" ? "bg-blue-glow shadow-[0_0_6px_#4dabf7]" : "bg-accent shadow-[0_0_6px_#ff6b6b]"}`} />
                    <span>{voiceGender === "male" ? "Male" : "Female"}</span>
                  </button>
                )}
                {supported.tts && (
                  <button
                    onClick={() => setVoice(!voiceOn)}
                    aria-label={voiceOn ? "Mute voice replies" : "Turn on voice replies"}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-hud"
                  >
                    {voiceOn ? <SpeakerHigh size={16} /> : <SpeakerSlash size={16} />}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

<<<<<<< HEAD
<<<<<<< Updated upstream
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
=======
            {/* Inspector / Self-Learning HUD Bar */}
            <AnimatePresence>
              {inspectorOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-[rgba(255,182,72,0.2)] bg-[rgba(10,13,24,0.95)] px-4 py-2.5 font-mono text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2 text-muted">
                    <span className="flex items-center gap-1.5 text-hud font-semibold">
                      <Brain size={14} /> Memory & Self-Learning
                    </span>
                    <span className="text-[10px] text-fg/70">
                      Facts: {memStats.factsCount}/{memStats.maxFacts} · Turns: {memStats.turnsCount}/{memStats.maxTurns}
                    </span>
                  </div>
                  {memStats.profile && Object.keys(memStats.profile).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted">
                      {memStats.profile.name && (
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-fg">
                          User: {memStats.profile.name}
                        </span>
                      )}
                      {memStats.profile.role && (
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-fg">
                          Role: {memStats.profile.role}
                        </span>
                      )}
                      {memStats.profile.company && (
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-fg">
                          @ {memStats.profile.company}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/40 pt-1.5 text-[10px]">
                    <span className="text-muted">
                      {memStats.learningEnabled ? "✓ Auto-extracting info" : "⏸ Learning paused"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleLearning()}
                        className="text-hud hover:underline"
                      >
                        {memStats.learningEnabled ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => {
                          clearMemory();
                          showToast("Memory reset to default.");
                        }}
                        className="text-accent hover:underline flex items-center gap-0.5"
                      >
                        <Trash size={12} /> Clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toast notice */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-hud/15 border-b border-hud/30 px-4 py-1.5 font-mono text-[11px] text-hud flex items-center gap-1.5"
                >
                  <Sparkle size={13} /> {toastMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation Log */}
            <div
              ref={listRef}
              className="no-scrollbar flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-live="polite"
            >
>>>>>>> Stashed changes
=======
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4" aria-live="polite">
>>>>>>> origin/kale-voice-slm
              {log.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={
                    m.who === "you"
                      ? "ml-8 rounded-lg border border-[rgba(255,182,72,0.3)] bg-[rgba(255,182,72,0.1)] px-3.5 py-2 text-sm text-fg"
                      : "mr-4 rounded-lg bg-surface-2/60 border border-line/40 px-3.5 py-2 font-mono text-[13px] leading-relaxed text-fg/90"
                  }
                >
                  {m.who === "ai" ? (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="hud-text mr-1.5 font-bold">&gt;</span>
                          {i === log.length - 1 ? <Typed text={m.text} /> : m.text}
                        </div>
                        {/* Inline Alter button visible in Inspector mode or on hover */}
                        {inspectorOpen && (
                          <button
                            onClick={() => startEdit(i, m)}
                            title="Alter this response"
                            className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[10px] text-hud border border-hud/30 hover:bg-hud hover:text-ink transition flex items-center gap-1"
                          >
                            <PencilSimple size={11} /> Alter
                          </button>
                        )}
                      </div>

                      {/* Telemetry info when Inspector mode is open */}
                      {inspectorOpen && m.meta && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line/30 pt-1.5 text-[10px] text-muted">
                          <span className="rounded bg-surface px-1 py-0.5 text-hud font-semibold">
                            {m.meta.source === "slm"
                              ? "⚡ On-Device SLM"
                              : m.meta.source?.startsWith("memory")
                                ? "🧠 Stored Memory"
                                : m.meta.source === "learned:custom"
                                  ? "⭐ Altered Q&A"
                                  : "⚙️ Intent Rule"}
                          </span>
                          {m.meta.confidence != null && (
                            <span>Conf: {(m.meta.confidence * 100).toFixed(1)}%</span>
                          )}
                          {m.meta.latencyMs != null && <span>{m.meta.latencyMs}ms</span>}
                          {m.meta.action && (
                            <span className="text-fg/80">
                              Action: {m.meta.action.type}:{m.meta.action.target || ""}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Inline Altering Drawer */}
                      {editingIndex === i && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 rounded border border-hud/40 bg-surface p-2.5 text-[11px]"
                        >
                          <p className="font-semibold text-hud flex items-center gap-1 mb-1.5">
                            <PencilSimple size={13} /> Alter Kyle's Response for this Query:
                          </p>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full rounded border border-line bg-chrome p-2 font-mono text-[12px] text-fg focus:border-hud focus:outline-none"
                            placeholder="Type the corrected answer..."
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-muted text-[10px] shrink-0">Action:</label>
                            <select
                              value={editAction}
                              onChange={(e) => setEditAction(e.target.value)}
                              className="flex-1 rounded border border-line bg-chrome px-2 py-1 text-[11px] text-fg focus:border-hud"
                            >
                              {AVAILABLE_ACTIONS.map((act) => (
                                <option key={act.value} value={act.value}>
                                  {act.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-2.5 flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyCorpusCode(m)}
                              className="rounded border border-line px-2 py-1 text-[10px] text-muted hover:text-fg"
                            >
                              Copy for corpus.py
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="rounded px-2 py-1 text-[10px] text-muted hover:text-fg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(m)}
                              className="rounded bg-hud px-2.5 py-1 text-[11px] font-semibold text-ink hover:opacity-90 flex items-center gap-1"
                            >
                              <FloppyDisk size={12} /> Save & Learn
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    m.text
                  )}
                </motion.div>
              ))}
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
              {thinking && (
                <p className="font-mono text-[13px] text-muted">
                  <span className="hud-text mr-2">&gt;</span>thinking…
                </p>
              )}
>>>>>>> Stashed changes
=======
              {thinking && <p className="font-mono text-[13px] text-muted"><span className="hud-text mr-2">&gt;</span>thinking…</p>}
>>>>>>> origin/kale-voice-slm
            </div>

            {/* Quick Suggestion Chips */}
            <div className="border-t border-[rgba(255,182,72,0.15)] bg-surface/80 px-3.5 py-2 backdrop-blur-md">
              <div
                ref={chipsRef}
                onMouseDown={onChipsMouseDown}
                className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth select-none cursor-grab active:cursor-grabbing"
              >
                {REAL_WORLD_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="shrink-0 whitespace-nowrap rounded-lg border border-[rgba(255,182,72,0.28)] bg-surface-2/90 px-3 py-1.5 font-mono text-[11px] font-medium text-fg/85 shadow-sm transition-all duration-200 hover:border-hud hover:bg-hud/15 hover:text-hud active:scale-95 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-[rgba(255,182,72,0.15)] p-2.5 bg-surface/50"
            >
              <label htmlFor="kale-input" className="sr-only">
                Ask {NAME}
              </label>
              <input
                id="kale-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  listening ? "Listening…" : "Ask anything, or teach: 'Remember that...'"
                }
                className="h-10 flex-1 rounded border border-line bg-surface px-3 font-mono text-[12px] text-fg placeholder:text-muted focus:border-hud focus:outline-none"
                autoComplete="off"
              />
              {supported.stt && (
                <button
                  type="button"
                  onClick={toggleListen}
                  aria-label={listening ? "Stop listening" : "Speak a question"}
                  className={`grid h-10 w-10 place-items-center rounded border transition ${
                    listening
                      ? "border-accent bg-accent text-ink"
                      : "border-line text-muted hover:text-hud hover:border-hud"
                  }`}
                >
                  <Microphone size={16} />
                </button>
              )}
              <button
                type="submit"
                aria-label="Send"
                className="grid h-10 w-10 place-items-center rounded bg-hud text-ink transition hover:opacity-95 active:scale-95"
              >
                <PaperPlaneRight size={16} weight="fill" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
