# "Model to Product" Portfolio Redesign — Design + Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]`.

## Context

Omkar (final-year B.E. CSE-AI student, job-seeking) wants the portfolio rebuilt around the **Sharkfold "From Idea to Impact"** Dribbble shot (dribbble.com/shots/27504891): cinematic dark stage, giant condensed two-tone headline, blue/red rim-lit portrait on a striped light wall, neon red→blue ring portal with floating glass cards, metric cards, featured-project strip, big CTA. On top of that he wants:
- a **JARVIS-like guide on the front page** that greets and guides the visitor → named **K.A.L.E.** ("Knowledge Assistant for Learning & Engineering"),
- a **Vision-like analyst for projects** → named **IRIS** (original character, my pick; renameable),
- a **Model Lab** isometric pipeline (from the Nuviq screenshot) for **TriHub ERP**,
- **Research in tabs** connected by an AI lineage graph,
- **rich colors**; the current particle field + 4 themes are **replaced**.

Decisions taken: guide stays **browser-only** (upgrade existing intent engine + Web Speech API); pneumonia paper **kept but with zero numbers/charts**; ERP stages **come from Omkar** (he will list the real modules); never inflate experience (memory: portfolio-positioning).

**IP rule:** characters are original. No "JARVIS", "Vision", "Marvel", Stark/Avengers names, faces, or logos anywhere in copy, code names, or assets.

## Design

**Palette (Sharkfold base, enriched):** `--bg #030306` · `--navy #092659` · `--blue #0252AC` · `--blue-glow #3B8BFF` · `--red #D31816` · `--red-glow #FF3B3B` · `--wine #591E28` · `--text #F6F6F6` · `--muted #A6A9AF` · `--steel #8994B4` · K.A.L.E. HUD `--hud #4FD8FF` (cyan) · IRIS `--gem #FFC23D` (gold). One theme, dark only.
**Type:** display `Big Shoulders Display Variable` (condensed, 300–900, uppercase, tracking -0.01em; second half of headlines in `--muted`, Sharkfold style). UI/body stays Geist + Geist Mono.

**Page flow:**
1. **Landing = K.A.L.E. full-screen HUD (100dvh, pinned)** — cinematic holographic AI interface in the film-HUD style, built from scratch (no copied film graphics or Marvel assets):
   - **Boot (≈3s, skippable):** black → single cyan scanline → center core ignites → rings draw on with stroke-dash animation → mono log lines type in the corners ("K.A.L.E. v1.0 · core online · loading Omkar Kale profile").
   - **Core structure (canvas 2D, DPR-aware, ~8 layers):** glowing core with pulsing radial bloom; inner segmented ring (CW); tick-scale ring with 360 ticks, every 10th long (CCW); 3 arc gauges with sweep-filled percentage arcs; dashed orbit ring with travelling data dots; outer bracket ring with 4 notched corners; radar scan sweep (conic gradient wedge); hex-grid haze behind. Each layer has its own speed/direction, and parallax tilts toward the mouse (max 6°).
   - **Side panels (DOM, glass + cyan hairlines):** left "PROFILE" readout (name, role "Final-year AI student", 2 papers, TriHub live); right "SYSTEMS" mini-graphs (attention weeks sparkline, live clock, status bars); bottom audio waveform ring that reacts while K.A.L.E. speaks.
   - **Greeting:** K.A.L.E. types (and speaks after the first click) "Good evening. I'm K.A.L.E., Omkar's assistant. Who's visiting?" with chips Recruiter / Engineer / Just exploring → guided tour. A "Scroll to enter" cue at the bottom.
   - **Scroll exit:** rings scale up and fade, core collapses into a point, and the screen wipes into the Sharkfold hero (scroll-scrubbed, `useScroll` over a 200vh pinned wrapper). K.A.L.E. then shrinks into the bottom-right dock orb.
   - Reduced motion: static fully drawn HUD, no boot and no pin.
2. **Hero (after scroll, with Omkar's photo)** — headline `FROM MODEL / TO PRODUCT`; subline "Final-year AI student. I build deep learning models that explain themselves, and ship them inside real software."; portrait right with blue (left) / red (right) rim glow on a vertical-stripe light wall (CSS gradients + blur); CTAs View work / Résumé. K.A.L.E. orb bottom-left asks: *"Who's visiting? Recruiter · Engineer · Just exploring"* → each chip starts a guided tour (scrolls + speaks a 1-line intro per section).
3. **Metrics** — glass cards: 94.6% (transformer acc), 32,000+ students, 2 papers, 3000+ CRM records, TriHub "Live". No pneumonia numbers.
4. **Portal "What I build"** — neon conic ring (red→blue, canvas/SVG + blur) with 4 floating glass cards: Explainable vision · Temporal models · Speech & NLP · Agentic software.
5. **Research Lab (tabs)** — lineage graph on top (nodes: CNNs → Explainable AI; Attention → Temporal Transformer; both → AI Systems). Tabs = graph nodes; active tab lights its node + edges. Tab 1 pneumonia: title, first-author, question, Grad-CAM/LIME/SHAP visual toggle, qualitative findings only. Tab 2 transformer: existing results table + attention weeks 6–8.
6. **Projects + IRIS** — Sharkfold featured strip; IRIS (gold-gem synthetic hologram, SVG) sits beside it; selecting a card triggers a scan sweep and a readout `INPUT / MODEL / OUTPUT / STACK` built only from existing project text.
7. **Model Lab: TriHub ERP** — isometric glass modules (CSS 3D `rotateX(55deg) rotateZ(-45deg)`) on a grid floor, connected by a pipeline that lights stage by stage as you scroll (scroll-scrubbed). Stages from `erpPipeline` in `data.js` (Omkar supplies).
8. **Systems, Experience, Stack, Contact** — restyled; big CTA "LET'S BUILD / WHAT'S NEXT". No testimonials (none exist; never fabricate).
- **K.A.L.E. dock** persists bottom-right after hero (replaces `Assistant.jsx` UI), voice opt-in only after a click (autoplay policy).

**K.A.L.E. "looks real":** canvas-2D HUD orb — 3–4 counter-rotating segmented arcs + tick rings (port `arcs()`/`ticks()` geometry from `src/three/Scene.jsx:159-185`), radial scan sweep, core glow, waveform ring that animates while `speechSynthesis` speaks (boundary events drive amplitude), state colors idle/listening/speaking.

**Portrait (Omkar supplies):** chest-up, plain background, soft even light, dark plain top, ≥1500px tall, sharp. Delivered as background-removed PNG at `public/me.png` (he removes bg, or I ask before installing any bg-removal tool). Placeholder silhouette until then.

**Removed:** `three`, `@react-three/*`, `postprocessing`, `src/three/*`, `Chapter.jsx`, `Hud.jsx`, theme picker/`theme.js` multi-theme, `pixel.jsx` if unused, pneumonia ROC/confusion figures.

## Global Constraints
- Copy: student framing; only numbers from papers/resume in `src/data.js`; verbs per BRAND voice; no "elevate/seamless/revolutionize".
- No Marvel names/likeness anywhere (grep check in Task 9).
- Zero pneumonia metrics on the site: strings `93%`, `0.960`, `21,293`, `21293` must not appear in `src/`.
- `prefers-reduced-motion`: all motion collapses to static; tours scroll instantly.
- Works at 375px wide with no horizontal scroll; 16px gutters.
- Voice features degrade silently where `SpeechRecognition`/`speechSynthesis` is missing (Firefox).

## Review Focus
1. Browser without SpeechRecognition (Firefox) → mic button hidden, text chat works. (Task 2 test)
2. Voice before any user gesture → nothing speaks, no console error. (Task 3 check)
3. `public/me.png` missing → silhouette placeholder renders, no broken image. (Task 4 check)
4. `erpPipeline` empty → Model Lab section not rendered. (Task 7 check)
5. Unknown question to K.A.L.E. → fallback lists what it can answer and offers the tour. (Task 2 test)

---

### Task 1: Foundation — tokens, font, strip 3D/themes
**Files:** Modify `src/index.css`, `src/App.jsx`, `src/components/Nav.jsx`, `package.json`, `BRAND.md`; Delete `src/three/*`, `src/theme.js`, `src/components/Chapter.jsx`, `src/components/Hud.jsx`.
- [ ] `npm i @fontsource-variable/big-shoulders-display`; `npm uninstall three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing`.
- [ ] Replace the 4 `[data-theme]` blocks with one `:root` using the palette above; add `--font-display` to `@theme`.
- [ ] Remove `ThemePicker`, `Scene`, `Chapter`, `Hud` usages; Nav restyled as Sharkfold glass pill.
- [ ] Update BRAND.md color/type/3D sections to the new system.
- [ ] Verify: `npm run build` succeeds; `preview_start portfolio` shows page with no console errors.
- [ ] Commit `refactor: new Sharkfold-based token system, remove WebGL and themes`.

### Task 2: K.A.L.E. intent engine (pure, tested)
**Files:** Create `src/kale/intents.js`, `src/kale/intents.test.js`; add `vitest` devDep + `"test": "vitest run"`.
**Produces:** `answer(raw: string) -> { text: string, action?: { type: "scroll"|"download"|"open"|"tour", target?: string } }`, `TOURS: Record<"recruiter"|"engineer"|"explore", Array<{ target: string, line: string }>>`.
- [ ] Tests: `answer("hello")` text contains `K.A.L.E.`; `answer("pneumonia")` action `{type:"scroll",target:"#research"}` and text has no digits matching `/93|0\.96|21,?293/`; `answer("resume")` action type `download`; `answer("asdfgh")` text mentions "tour"; `answer("theme")` does not change theme (fallback); each `TOURS` entry targets an id that exists in the section list `["#top","#metrics","#build","#research","#projects","#lab","#experience","#contact"]`.
- [ ] Run `npm test` → FAIL. Port `INTENTS` from `Assistant.jsx:22-129` into pure functions returning actions (no DOM). Run → PASS.
- [ ] Commit `feat: K.A.L.E. intent engine with tours`.

### Task 3: K.A.L.E. landing HUD + dock
**Files:** Create `src/kale/hudLayers.js` (one draw fn per layer: `drawCore, drawSegRing, drawTicks, drawGauges, drawOrbit, drawBrackets, drawSweep, drawHex` each `(ctx, t, r, level)`), `src/kale/Orb.jsx` (canvas compositor, `size` prop; full HUD on landing, reduced layer set in dock), `src/kale/Landing.jsx` (pinned 200vh boot + panels + greeting + scroll exit, `id="top"`), `src/kale/Kale.jsx` (dock, `variant: "dock"`), `src/kale/voice.js` (`speak(text, onLevel)`, `listen(onText)`, `supported: {tts, stt}`); Delete `src/components/Assistant.jsx`.
**Consumes:** `answer`, `TOURS` (Task 2).
- [ ] Orb props `{ state: "idle"|"listening"|"speaking", level: number, size: number }`; DPR-aware canvas, rAF paused when offscreen (IntersectionObserver) and static frame under reduced motion.
- [ ] Hero greeter: chips Recruiter / Engineer / Just exploring → runs tour (scroll + typed line + speak if voice enabled). Voice toggle off by default; first click enables.
- [ ] Verify in browser: orb animates, chips scroll through sections, voice speaks after click only, mic hidden when `stt` false (check by `delete window.webkitSpeechRecognition` + reload). Screenshot.
- [ ] Commit `feat: K.A.L.E. holographic guide`.

### Task 4: Hero + Metrics (Sharkfold)
**Files:** Modify `src/components/Hero.jsx`, `Metrics` in `src/components/Sections.jsx`, `src/data.js` (`metrics`), `index.css` (`.light-wall`, `.rim-blue`, `.rim-red`).
- [ ] `metrics` = the 5 items in Design §3 (remove ~93% and 21,293).
- [ ] Hero per Design §2 (`id="hero"`, placed right after `Landing`); portrait `<img src="/me.png" onError→silhouette>`; headline lines rise-in when the landing exit completes (reuse `rise()`).
- [ ] Verify desktop + 375px screenshots; no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] Commit `feat: Sharkfold hero and metric cards`.

### Task 5: Portal "What I build"
**Files:** Create `src/components/Portal.jsx` (`id="build"`), add to `App.jsx`.
- [ ] Neon ring: SVG circle stroke with conic gradient (red→wine→blue) + 2 blurred copies; slow rotation; 4 glass cards absolutely placed around it (stacked list under 768px).
- [ ] Verify screenshot, reduced-motion static. Commit `feat: neon portal section`.

### Task 6: Research Lab tabs + lineage graph
**Files:** Modify `src/components/Research.jsx` (export `ResearchLab`, `id="research"`), `src/data.js` (`xaiPaper`: delete `figures`, ensure no metrics in findings; add `researchGraph: { nodes:[{id,label,tab?}], edges:[[from,to]] }`).
- [ ] Rewrite xaiPaper findings qualitatively: "Benchmarked ResNet50V2, VGG16 and VGG19 on a public chest X-ray dataset." / "ResNet50V2 performed best of the three." / "Grad-CAM is fast but coarse; KernelSHAP is faithful but too slow for real time."
- [ ] Graph as SVG; tab buttons `role="tab"` with arrow-key navigation; clicking a node switches tab; active path glows `--blue-glow`.
- [ ] Data test in `src/data.test.js`: serialized `data.js` exports contain none of `93%`, `0.960`, `21,293`, `21293`. Run → PASS.
- [ ] Commit `feat: research lab with tabs and AI lineage graph`.

### Task 7: Model Lab — TriHub ERP pipeline
**Blocked on Omkar's module list.** **Files:** Create `src/components/ModelLab.jsx` (`id="lab"`); `src/data.js` add `erpPipeline: Array<{ id, label, detail, icon }>` (exactly his modules; empty array until provided).
- [ ] Isometric modules on `.dot-field` grid floor; SVG connector path; `useScroll` progress → `activeIndex = floor(progress * n)` lights module + segment; "Live ↗" link to trihuberp.up.railway.app.
- [ ] Renders `null` when `erpPipeline.length === 0`. Mobile: vertical stack, no isometric transform.
- [ ] Verify scroll lighting + 375px. Commit `feat: Model Lab ERP pipeline`.

### Task 8: Projects + IRIS analyst
**Files:** Create `src/components/Iris.jsx`; modify `src/components/Projects.jsx`; `src/data.js` add `scan: { input, model, output }` per project (paraphrase existing `body` only).
- [ ] IRIS: SVG synthetic head/visor silhouette with gold gem core, idle pulse; on card select → scan-line sweep over the card (clip-path), then readout typed in Geist Mono.
- [ ] Keyboard: cards are buttons; readout `aria-live="polite"`.
- [ ] Verify + screenshot. Commit `feat: IRIS project analyst`.

### Task 9: Restyle remaining sections + final verification
**Files:** `Sections.jsx` (Systems, Experience, Stack, Contact), `Loader.jsx`, `App.jsx` order: Hero, Metrics, Portal, ResearchLab, Projects, ModelLab, Systems, Experience, Stack, Contact.
- [ ] Contact CTA `LET'S BUILD / WHAT'S NEXT`; Loader lines "K.A.L.E. online".
- [ ] Checks: `npm test` pass; `npm run build` pass; `rg -i "jarvis|marvel|stark|avenger|\bvision\b" src` → only the research word "vision" in non-character contexts, reviewed by eye; `rg "93%|0\.960|21,?293" src` → no hits; console clean; Lighthouse a11y ≥ 90; 375px no horizontal scroll; reduced-motion emulation static.
- [ ] Desktop + mobile screenshots shared with Omkar. Commit `feat: complete Sharkfold redesign`.

## Inputs still needed from Omkar
1. Portrait photo (spec above).
2. TriHub ERP module list (blocks Task 7 only; other tasks proceed).
3. OK to name the project analyst **IRIS**.

Note: no image-generation tool is available in this session, so `imagegen-frontend-web` comps can't be produced; visuals are built in code (CSS/SVG/canvas).
