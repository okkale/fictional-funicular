# Omkar Kale · Brand Kit

## Positioning
**Models that explain themselves, shipped inside real software.**
An AI engineer who publishes deep learning work and ships agent-powered business systems (ERP, CRM, web). The brand reads as calm, precise, senior: it shows work, it does not shout.

## Mark
- **Monogram:** `OK.` set in Geist 700, tight tracking, inside a 10px-radius square. The trailing dot is signal red. See `public/favicon.svg`.
- **Wordmark:** `Omkar Kale` in Geist 600, tracking -0.02em.
- Clear space: the height of the "O" on every side.

## Color (one cinematic dark theme, after the Sharkfold palette)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#030306` | Page stage |
| `--surface` / `--surface-2` | `#0A0D18` / `#121A2E` | Glass cards, insets |
| `--chrome` | `#050812` | Fixed chrome (nav, Kyle dock, chat, tour bar) at 70–90% |
| `--line` | `rgba(137,148,180,.22)` | Hairlines |
| `--text` / `--muted` / `--steel` | `#F6F6F6` / `#A6A9AF` / `#8994B4` | Text tiers |
| `--navy` / `--blue` / `--blue-glow` | `#092659` / `#0252AC` / `#5A9DFF` | Left rim light, selected tabs, research |
| `--red` / `--accent` | `#D31816` / `#FF3B3B` | Right rim light, live dots, headline full stops, the one Contact CTA |
| `--wine` | `#591E28` | Shadow tone in gradients |
| `--hud` | `#FFB648` | Kyle's gold: the sphere and dock, every section eyebrow, the headline light sweep, card hover borders, the current-role dot, the hero readout, the focus ring |

Lighting rule: blue spills from the left, red from the right (portrait, light wall, contact glow).

Action rule: the primary button on a screen is a solid white pill (`bg-fg text-ink`). Solid red is kept for the single final CTA (Contact, "Let's talk"), so a button never blends into the red light. Gold is the only warm hue. It is Kyle's colour and marks where the guide is present: a gold eyebrow (`<Eyebrow>`, a short gold tick plus a mono caption) opens every section, so the landing's gold runs down the whole page. Gold is for small light and labels, never large fills or body text.

## Characters (original, no film or comic references)
- **Kyle**: the guide (named K.A.L.E. until 2026-10-16; code still lives in `src/kale/`). On the landing it is a warm gold holographic sphere in three.js (`src/kale/Sphere.jsx`): filament shells, circuit traces, beams, a ring-tunnel core, particles and bokeh under bloom, all procedural from a fixed seed. It assembles on boot, swells with its voice, and the scroll flies the camera into the core. In the corner dock it is a compact canvas HUD (`Orb.jsx`). Tours are briefing cards (`TourCard.jsx`). Browser-only intent engine (`src/kale/intents.js`), Web Speech API voice.

## Type
- **Display:** Big Shoulders Display Variable, 800, uppercase, condensed poster caps (`.display`). Second half of a headline in `--muted`.
- **UI + body:** Geist Variable. **Data + labels:** Geist Mono Variable.

## Shape
- Interactive (buttons, chips, toggles): full pill.
- Containers (cards, panels): 20px radius.
- Small marks (monogram, icons tiles): 10px.

## Motion principles
- Ease: `cubic-bezier(0.16, 1, 0.3, 1)` for reveals; springs (stiffness 150, damping 15) for magnetic/tilt.
- Landing: ≈3s skippable boot, then the camera flies into the sphere on scroll (200vh pin).
- Section headlines wipe in behind a light sweep; cards tilt toward the cursor (max 6°); a soft light trails the cursor on desktop.
- Motion explains: networks pulse to show inference, pipelines light stage by stage, numbers count to show scale.
- Everything collapses to static under `prefers-reduced-motion`.

## Voice
Plain and concrete. Verbs from the work: classify, transcribe, summarize, automate, ship. No "elevate", "seamless", "revolutionize".
