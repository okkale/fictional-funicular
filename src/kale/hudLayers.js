// Kyle holographic HUD, drawn on canvas 2D. Each layer is a pure function:
//   (ctx, t, R, p, s) → draws centered at (0, 0)
// t: seconds, R: outer radius in px, p: boot progress for this layer (0..1, draws the layer on),
// s: { level 0..1 voice amplitude, tint "idle" | "listening" | "speaking" }.

const TAU = Math.PI * 2;
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export const HUD = "255,182,72"; // --hud warm gold
const RED = "255,59,59";
const tintRGB = (s) => (s.tint === "listening" ? RED : HUD);
const c = (rgb, a) => `rgba(${rgb},${a})`;

// Arc drawn on from a0 by progress p.
function arc(ctx, r, a0, a1, p = 1) {
  ctx.beginPath();
  ctx.arc(0, 0, r, a0, a0 + (a1 - a0) * ease(p));
  ctx.stroke();
}

function glow(ctx, rgb, blur) {
  ctx.shadowColor = c(rgb, 0.9);
  ctx.shadowBlur = blur;
}

// Faint hex lattice behind everything, fading out at the edges.
export function drawHex(ctx, t, R, p) {
  const size = Math.max(10, R * 0.07);
  const h = size * Math.sqrt(3);
  const lim = R * 1.25;
  ctx.lineWidth = 1;
  for (let y = -lim; y <= lim; y += h / 2) {
    const row = Math.round(y / (h / 2));
    for (let x = -lim; x <= lim; x += size * 3) {
      const cx = x + (row % 2 ? size * 1.5 : 0);
      const d = Math.hypot(cx, y) / lim;
      if (d > 1) continue;
      const a = (1 - d) * 0.07 * ease(p) * (0.6 + 0.4 * Math.sin(t * 0.8 + cx * 0.02 + y * 0.03));
      ctx.strokeStyle = c(HUD, a);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * TAU;
        const px = cx + Math.cos(ang) * size * 0.5;
        const py = y + Math.sin(ang) * size * 0.5;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

// Glowing reactor core with a breathing bloom; swells with the voice.
export function drawCore(ctx, t, R, p, s) {
  const rgb = tintRGB(s);
  const k = ease(p);
  const r = R * 0.15 * k * (1 + 0.06 * Math.sin(t * 2.2) + 0.28 * s.level);
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3.2);
  bloom.addColorStop(0, c(rgb, 0.45 * k));
  bloom.addColorStop(0.4, c(rgb, 0.12 * k));
  bloom.addColorStop(1, c(rgb, 0));
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.2, 0, TAU);
  ctx.fill();
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, `rgba(255,255,255,${0.95 * k})`);
  core.addColorStop(0.35, c(rgb, 0.9 * k));
  core.addColorStop(1, c(rgb, 0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  // Two thin rings hugging the core.
  ctx.strokeStyle = c(rgb, 0.7 * k);
  ctx.lineWidth = Math.max(1, R * 0.006);
  glow(ctx, rgb, 10);
  arc(ctx, R * 0.19, -Math.PI / 2, (3 * Math.PI) / 2, p);
  ctx.strokeStyle = c(rgb, 0.3 * k);
  arc(ctx, R * 0.215, t * 0.6, t * 0.6 + TAU * 0.8, p);
  ctx.shadowBlur = 0;
}

// Thick segmented ring, clockwise.
export function drawSegRing(ctx, t, R, p, s) {
  const rgb = tintRGB(s);
  const r = R * 0.29;
  const n = 12;
  ctx.lineWidth = R * 0.028;
  ctx.lineCap = "butt";
  glow(ctx, rgb, 14);
  const rot = t * 0.35;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU;
    const span = (TAU / n) * (i % 3 === 0 ? 0.42 : 0.68);
    ctx.strokeStyle = c(rgb, i % 4 === 0 ? 0.85 : 0.45);
    arc(ctx, r, a0, a0 + span, Math.min(1, p * 1.4 - i * 0.03));
  }
  ctx.shadowBlur = 0;
}

// Fine tick scale, counter-clockwise; every 10th tick long, every 30th labelled.
export function drawTicks(ctx, t, R, p) {
  const r = R * 0.41;
  const n = R > 160 ? 360 : 120;
  const rot = -t * 0.07;
  const shown = Math.floor(n * ease(p));
  const every = n === 360 ? 10 : 4;
  ctx.lineWidth = 1;
  for (let i = 0; i < shown; i++) {
    const a = rot + (i / n) * TAU;
    const long = i % every === 0;
    const len = long ? R * 0.035 : R * 0.014;
    ctx.strokeStyle = c(HUD, long ? 0.75 : 0.28);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * (r + len), Math.sin(a) * (r + len));
    ctx.stroke();
  }
  if (R > 160 && p > 0.8) {
    ctx.fillStyle = c(HUD, 0.55 * ease((p - 0.8) * 5));
    ctx.font = `${Math.round(R * 0.026)}px "Geist Mono Variable", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let d = 0; d < 360; d += 30) {
      const a = rot + (d / 360) * TAU;
      ctx.fillText(String(d).padStart(3, "0"), Math.cos(a) * (r + R * 0.065), Math.sin(a) * (r + R * 0.065));
    }
  }
}

// Three arc gauges that sweep to a reading and drift.
export function drawGauges(ctx, t, R, p, s) {
  const r = R * 0.53;
  const w = R * 0.018;
  for (let g = 0; g < 3; g++) {
    const base = -Math.PI / 2 + g * (TAU / 3) + 0.18;
    const span = TAU / 3 - 0.36;
    const val = 0.55 + 0.3 * Math.sin(t * (0.4 + g * 0.17) + g * 2) + (g === 0 ? 0.15 * s.level : 0);
    ctx.lineWidth = w;
    ctx.strokeStyle = c(HUD, 0.1);
    arc(ctx, r, base, base + span, p);
    ctx.strokeStyle = c(g === 1 ? RED : HUD, 0.85);
    glow(ctx, g === 1 ? RED : HUD, 12);
    arc(ctx, r, base, base + span * Math.min(1, val), p);
    ctx.shadowBlur = 0;
    // End caps
    ctx.lineWidth = 1;
    ctx.strokeStyle = c(HUD, 0.6 * ease(p));
    for (const a of [base, base + span]) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - w * 1.2), Math.sin(a) * (r - w * 1.2));
      ctx.lineTo(Math.cos(a) * (r + w * 1.2), Math.sin(a) * (r + w * 1.2));
      ctx.stroke();
    }
  }
}

// Dashed orbit with data packets travelling around it.
export function drawOrbit(ctx, t, R, p) {
  const r = R * 0.65;
  ctx.lineWidth = 1;
  ctx.strokeStyle = c(HUD, 0.35 * ease(p));
  ctx.setLineDash([R * 0.012, R * 0.022]);
  arc(ctx, r, t * 0.12, t * 0.12 + TAU, p);
  ctx.setLineDash([]);
  if (p < 1) return;
  for (let i = 0; i < 4; i++) {
    const a = t * (0.5 + i * 0.13) + i * 1.7;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    glow(ctx, HUD, 12);
    ctx.fillStyle = c(HUD, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, R * 0.008), 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Trail
    ctx.strokeStyle = c(HUD, 0.5);
    ctx.lineWidth = Math.max(1, R * 0.004);
    arc(ctx, r, a - 0.35, a, 1);
  }
}

// Voice waveform ring: bars pushed outward by the speech level.
export function drawWave(ctx, t, R, p, s) {
  const rgb = tintRGB(s);
  const r = R * 0.74;
  const n = R > 160 ? 120 : 48;
  ctx.lineWidth = Math.max(1, R * 0.006);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const noise = Math.abs(Math.sin(i * 0.9 + t * 7) * Math.sin(i * 0.37 - t * 3.1));
    const len = R * (0.008 + 0.012 * Math.abs(Math.sin(i * 0.2 + t)) + 0.09 * s.level * noise) * ease(p);
    ctx.strokeStyle = c(rgb, 0.25 + 0.6 * s.level * noise);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * (r + len), Math.sin(a) * (r + len));
    ctx.stroke();
  }
}

// Radar sweep: a fading wedge rotating around the HUD.
export function drawSweep(ctx, t, R, p) {
  if (p <= 0 || typeof ctx.createConicGradient !== "function") return;
  const a = t * 0.9;
  const g = ctx.createConicGradient(a, 0, 0);
  g.addColorStop(0, c(HUD, 0.18 * ease(p)));
  g.addColorStop(0.08, c(HUD, 0));
  g.addColorStop(1, c(HUD, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.86, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = c(HUD, 0.5 * ease(p));
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86);
  ctx.stroke();
}

// Outer frame: thin ring with four heavy notched brackets.
export function drawBrackets(ctx, t, R, p) {
  const r = R * 0.88;
  ctx.lineWidth = 1;
  ctx.strokeStyle = c(HUD, 0.3);
  arc(ctx, r, Math.PI, Math.PI + TAU, p);
  ctx.lineWidth = R * 0.016;
  ctx.strokeStyle = c(HUD, 0.8);
  glow(ctx, HUD, 10);
  const rot = Math.sin(t * 0.25) * 0.08;
  for (let q = 0; q < 4; q++) {
    const mid = rot + Math.PI / 4 + (q * Math.PI) / 2;
    arc(ctx, r + R * 0.03, mid - 0.32, mid - 0.06, p);
    arc(ctx, r + R * 0.03, mid + 0.06, mid + 0.32, p);
  }
  ctx.shadowBlur = 0;
  // Cardinal notches
  ctx.lineWidth = 2;
  ctx.strokeStyle = c(HUD, 0.7 * ease(p));
  for (let q = 0; q < 4; q++) {
    const a = (q * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - R * 0.03), Math.sin(a) * (r - R * 0.03));
    ctx.lineTo(Math.cos(a) * (r + R * 0.06), Math.sin(a) * (r + R * 0.06));
    ctx.stroke();
  }
}

// Draw order, innermost last so the core sits on top. `start` staggers the boot draw-on.
export const LAYERS = [
  { draw: drawHex, start: 0.0, full: true },
  { draw: drawSweep, start: 0.55, full: true },
  { draw: drawBrackets, start: 0.1 },
  { draw: drawWave, start: 0.45 },
  { draw: drawOrbit, start: 0.3, full: true },
  { draw: drawGauges, start: 0.35 },
  { draw: drawTicks, start: 0.2 },
  { draw: drawSegRing, start: 0.15 },
  { draw: drawCore, start: 0.05 },
];
