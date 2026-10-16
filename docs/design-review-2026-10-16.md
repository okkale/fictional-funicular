## Frontend Design Review: Omkar Kale Portfolio (K.A.L.E. / Sharkfold build)

Reviewed 2026-10-16 against `BRAND.md`, the source in `src/`, and the running dev build (desktop 1024px and mobile 375px).

### Context
- **Purpose**: A job-hunting portfolio for AI/ML engineer roles. A final-year student shows published research and shipped software.
- **Aesthetic Direction**: Cinematic dark "light wall" after the Sharkfold shot. Blue rim light comes from the left and red from the right. Condensed poster caps, a gold holographic guide (K.A.L.E.) and a cyan project analyst (IRIS).
- **User Task**: A recruiter decides in under a minute whether to shortlist him. An engineer checks whether the work is real. Both need to reach the research, the projects, the résumé and contact details fast.

### Summary
**Needs Work.** The visual direction is distinctive and the build quality is high. Two content gaps hurt the core recruiter task: the hero portrait is a placeholder and there is no share image. Three craft issues also need fixing: weak focus rings, an overlapping assistant dock, and a lot of 10–11px text.

### Design System Compliance
There is no Figma file. The design system is `BRAND.md` plus the tokens in `src/index.css`, so the review checks against those.
- [x] Tokens defined on `:root` and mapped into Tailwind `@theme` (`src/index.css:6-49`)
- [x] Shape rules followed: pill controls, 20px containers, 10px monogram
- [x] Type system followed: Big Shoulders 800 display, Geist UI, Geist Mono labels (all three load)
- [x] Motion ease `cubic-bezier(0.16,1,0.3,1)` is used everywhere via `EASE`
- [ ] **9 hard-coded hex surfaces** bypass the tokens: `#030714` ×3, `#070a14` ×2, `#07080d`, `#060914`, `#070b18`, `#0b0e18` in Hero, ModelLab, Nav, Kale, Landing and TourBar. They are all near-`--surface` navy-blacks. Add a `--surface-0` (or `--glass`) token and use it everywhere.
- [ ] Rim-light `rgba(59,139,255,…)` / `rgba(255,59,59,…)` values repeat inline in shadows and gradients. Consider `--blue-glow-rgb` / `--red-glow-rgb` channels.

### Aesthetic Quality
- [x] Clear conceptual direction. Nothing about it reads as a template.
- [x] Distinctive typography. The condensed caps with a muted second half work well.
- [x] Cohesive palette with CSS variables. Gold is reserved for K.A.L.E. and cyan for IRIS, which is good discipline.
- [x] Intentional motion: boot, then a fly into the sphere, then a page hand-off, with wipe-in headlines. All of it respects `prefers-reduced-motion` (42 call sites).
- [x] Spatial composition: the orbit cards around the portal and the 3D Model Lab ribbon create real interest.
- [x] Atmosphere: grain, light wall, bloom and vignette.

### Pillar Assessment

| Pillar | Status | Notes |
|--------|--------|-------|
| Frictionless | 🟢 | Résumé is one click from every screen. Tours give three clear entry paths. Nav works on mobile. The landing scroll-snap is a deliberate trade-off (see Minor 4). |
| Quality Craft | 🟠 | Strong aesthetic, no horizontal overflow at 375px, labelled inputs, alt text on every image. Weak points: focus rings, dock overlap, small text, token leakage. |
| Trustworthy | 🟠 | Facts match the papers (`data.test.js` passes, 17/17). The portrait placeholder and the missing note that K.A.L.E. gives scripted answers undercut credibility. |

**Legend:** 🟢 Pass | 🟠 Needs attention | ⚫ Blocking issue

### Design Critique
**Verdict:** Needs work

**Rationale:** Nothing blocks a visitor. The direction is the strongest thing about the site, and accessibility basics (labels, alt text, landmarks, reduced motion, contrast) are mostly in place. But the page's first human moment, the "From model to product" hero, shows a generic silhouette. Shared links have no preview image. For a portfolio whose job is to get a person shortlisted, those two gaps cost more than any polish issue.

### Issues

**Blocking:** none.

**Major (should fix):**
1. **[Trustworthy] The hero portrait is a placeholder.** `/public/me.png` does not exist, so `Hero.jsx:363` falls back to a filled `User` icon. Recruiters see a faceless silhouette at the exact point where the page turns personal. Add a cut-out portrait (transparent PNG or WebP, about 1000px tall) so the rim-light drop-shadows have a real edge to catch. If you don't want a photo, replace the silhouette with something that carries information, such as a Grad-CAM tile or IRIS. A stock silhouette tells the visitor nothing.
2. **[Frictionless] No `og:image` / Twitter card.** Recruiters pass portfolio links around in LinkedIn, Slack and email, and right now those previews are blank. Add a 1200×630 card (name, "From model to product", the gold sphere) plus `twitter:card=summary_large_image` in `index.html`.
3. **[Quality Craft / a11y] The focus ring is the browser default.** It measures about 1px, `outline: auto`, light grey. On the white "I'm hiring" pill, the white résumé button and the gold submit button it is nearly invisible. There are no `:focus-visible` rules at all. Add one global rule, for example `:focus-visible { outline: 2px solid var(--hud); outline-offset: 3px; }`, with a dark variant on light fills. This is WCAG 2.4.7, needed for Grade B.
4. **[Quality Craft] The K.A.L.E. dock covers content.** The fixed bottom-right dock sits on top of the "Temporal models" orbit-card title, the right edge of the Projects cards, and the LinkedIn/GitHub icons in Contact. Either add `padding-bottom` to `main` for the dock's height plus 24px, or collapse the dock to the 56px orb only while it overlaps a section's interactive area.

**Minor (consider for refinement):**
1. **[a11y] 21 text nodes are 10–11px.** These are the mono eyebrows ("RESEARCH LAB", "STAGE 01"), the IRIS readout labels and "Ctrl K to ask". Contrast passes (muted is 8.7:1 on bg), but 10px mono uppercase is hard to read on a laptop. Raise the floor to 12px and keep the tracking.
2. **[Craft] The landing tagline sits on the brightest part of the sphere on mobile.** At 375px the paragraph and fact strip overlap the filaments. Add a stronger bottom-up scrim, or a soft `text-shadow: 0 1px 12px var(--bg)` on the copy.
3. **[Trustworthy] Say what K.A.L.E. is.** "Ask K.A.L.E. anything" suggests an LLM, but `intents.js` matches keywords and falls back to "I don't have that yet." The fallback is honest, but say it up front, for example a small "Answers from Omkar's portfolio, runs in your browser" line under the ask box. Engineers will respect the honesty more than the mystery.
4. **[Frictionless] Scroll hijack on the landing.** The first wheel, swipe or arrow press triggers a 1.3s non-cancelable glide (`useSnapToHero.js:22`), and `scrollRestoration = "manual"` replays the boot on every reload. That's fine on a first visit. For returning visitors, consider skipping the boot when `sessionStorage` shows they've already seen it.
5. **[Frictionless] Competing actions on the landing.** Visitors see three tour pills, a free-text ask box, three quick-ask chips and a résumé link at once. "I'm hiring" is correctly the one filled primary. Consider dropping the quick-ask chips until the input has focus, so there is one clear "next".
6. **[Design System] Token leakage.** See the 9 hex values listed above.
7. **[Perf] Bundle weight.** `Sphere` is lazy-loaded (≈511 KB raw), which is right. The main chunk is still ≈472 KB raw. Check that `three` stays out of it and that the ERP/research images are served as WebP or AVIF with `width`/`height` set.

### Recommendations
- **Tokens:** add `--surface-0: #070a14` and `--glow-blue-rgb: 59 139 255` / `--glow-red-rgb: 255 59 59` to `:root`, then replace the inline hexes and rgba values.
- **Focus:** add a global `:focus-visible` ring in `--hud` gold. It ties keyboard navigation to the guide character and matches the brand.
- **Hero:** a real cut-out portrait is the single highest-impact change on the site.
- **Meta:** add an OG/Twitter card image plus `og:url`, and a canonical link once the site is deployed.
- **Motion:** keep it as is. It is already orchestrated, gated on reduced motion, and explains rather than decorates, as `BRAND.md` asks.

### What's working (keep it)
- A distinctive, coherent direction with no generic-AI look.
- Facts are guarded by a test (`src/data.test.js`), so the inconsistent pneumonia numbers can't creep back.
- Semantic structure: one `h1`, logical `h2`/`h3`, `nav`/`main`/`footer`, labelled ask input, `aria-pressed` on the voice toggle, `aria-live` on replies, roving-focus tabs in Expertise and Research.
- No horizontal overflow at 375px, mobile menu present, and touch targets at 40–56px.
