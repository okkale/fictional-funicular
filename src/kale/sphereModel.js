import * as THREE from "three";

/*
  Kyle's sphere as plain data: the filament, circuit and beam segments, the dust and bokeh point
  clouds, and the camera framing. Built procedurally from a fixed seed, so the WebGL renderer
  (Sphere.jsx) and the 2D-canvas fallback (Sphere2D.jsx) draw the exact same sphere.
*/

export const GOLD = new THREE.Color("#ffb648"); // warm gold filament
export const HOT = new THREE.Color("#ffe6b8"); // hot core
export const EMBER = new THREE.Color("#ff8a2a"); // ember orange
// Additive light stacks fast: keep each filament dim and let bloom do the glowing.
const LINE_GAIN = 0.8;

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function randomUnit(r) {
  const z = r() * 2 - 1;
  const a = r() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return new THREE.Vector3(s * Math.cos(a), z, s * Math.sin(a));
}
const sph = (rad, lat, lon) => terrainAt(new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)), rad);

// Deterministic 3D value noise + fBm. Only used to shape the terrain once, at build time.
function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const s = (t) => t * t * (3 - 2 * t);
  const u = s(x - xi), v = s(y - yi), w = s(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}
function fbm(d) {
  let a = 0.5, f = 1.7, sum = 0, norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += a * vnoise(d.x * f + 11.3, d.y * f + 7.1, d.z * f + 3.7);
    norm += a;
    a *= 0.5;
    f *= 2.03;
  }
  return sum / norm; // ≈ 0.2..0.8, centred near 0.5
}
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Radius multiplier for a direction: basins at 0.97, land at ~1.0, rare ranges peak near 1.12.
function elevation(dir) {
  const n = fbm(dir);
  const land = smooth(0.48, 0.55, n);
  const range = smooth(0.63, 0.74, n); // only the top ~10% of the surface
  return 0.97 + 0.03 * land + 0.09 * range;
}
function terrainAt(dir, rad) {
  const d = dir.clone().normalize();
  return d.multiplyScalar(rad * elevation(d));
}

// Segment builder with per-vertex brightness (additive blending: darker = more transparent).
function segments() {
  const pos = [];
  const col = [];
  return {
    add(a, b, bright, color = GOLD) {
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const k = bright * LINE_GAIN;
      for (let i = 0; i < 2; i++) col.push(color.r * k, color.g * k, color.b * k);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      return g;
    },
  };
}


// Partial great-circle arcs on a shell.
function shell(r, count, rMin, rMax, dashed, relief = false) {
  const s = segments();
  for (let k = 0; k < count; k++) {
    const n = randomUnit(r);
    const u = new THREE.Vector3().crossVectors(n, Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
    const v = new THREE.Vector3().crossVectors(n, u);
    const rad = rMin + r() * (rMax - rMin);
    const a0 = r() * Math.PI * 2;
    const span = 0.3 + r() * Math.PI * 1.4;
    const steps = Math.ceil(span / 0.035);
    const bright = 0.18 + r() * 0.75;
    const dash = dashed && r() < 0.5;
    let prev = null;
    for (let i = 0; i <= steps; i++) {
      const t = a0 + (span * i) / steps;
      const d = u.clone().multiplyScalar(Math.cos(t)).add(v.clone().multiplyScalar(Math.sin(t)));
      const p = relief ? terrainAt(d, rad) : d.multiplyScalar(rad);
      if (prev && (!dash || i % 3 !== 0)) s.add(prev, p, bright * (0.6 + 0.4 * Math.sin((i / steps) * Math.PI)));
      prev = p;
    }
  }
  return s.build();
}

// Circuit traces walked across the sphere surface; returns lines and pad positions.
function circuits(r, count, rad) {
  const s = segments();
  const pads = [];
  for (let k = 0; k < count; k++) {
    let lat = (r() - 0.5) * 2.4;
    let lon = r() * Math.PI * 2;
    let rr = rad + (r() - 0.5) * 0.12;
    let prev = sph(rr, lat, lon);
    pads.push(prev);
    const steps = 4 + Math.floor(r() * 9);
    const bright = 0.35 + r() * 0.65;
    for (let i = 0; i < steps; i++) {
      if (i % 2 === 0) lon += (r() < 0.5 ? -1 : 1) * (0.05 + r() * 0.2);
      else lat += (r() < 0.5 ? -1 : 1) * (0.04 + r() * 0.14);
      if (r() < 0.15) rr += 0.05;
      const p = sph(rr, lat, lon);
      s.add(prev, p, bright, r() < 0.2 ? HOT : GOLD);
      prev = p;
    }
    pads.push(prev);
  }
  return { geometry: s.build(), pads };
}

// Long beams: spokes out of the core and chords straight through the sphere.
function beams(r) {
  const s = segments();
  for (let k = 0; k < 16; k++) {
    const d = randomUnit(r);
    s.add(d.clone().multiplyScalar(0.55), d.clone().multiplyScalar(2.3 + r() * 1.6), 0.12 + r() * 0.3);
  }
  for (let k = 0; k < 12; k++) {
    s.add(randomUnit(r).multiplyScalar(2.05), randomUnit(r).multiplyScalar(2.05), 0.1 + r() * 0.25, r() < 0.3 ? EMBER : GOLD);
  }
  return s.build();
}
function pointCloud(r, targets, sizeMin, sizeMax, scatter) {
  const n = targets.length;
  const pos = new Float32Array(n * 3);
  const sc = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const seed = new Float32Array(n);
  targets.forEach((p, i) => {
    pos.set([p.x, p.y, p.z], i * 3);
    const far = randomUnit(r).multiplyScalar(scatter * (0.6 + r()));
    sc.set([far.x, far.y, far.z], i * 3);
    size[i] = sizeMin + r() * (sizeMax - sizeMin);
    seed[i] = r();
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aScatter", new THREE.BufferAttribute(sc, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  return g;
}

// Core: tunnel of rings facing the viewer. [radius, tube, arc, colour, opacity, z]
export const RINGS = [
  [0.34, 0.03, Math.PI * 2, HOT, 0.75, 0],
  [0.22, 0.022, Math.PI * 2, GOLD, 0.6, -0.25],
  [0.13, 0.016, Math.PI * 2, GOLD, 0.5, -0.5],
  [0.48, 0.008, Math.PI * 2, GOLD, 0.8, 0.02],
  [0.62, 0.012, Math.PI * 1.35, GOLD, 0.9, 0.04],
  [0.74, 0.006, Math.PI * 0.8, HOT, 0.8, 0.05],
];

export function buildModel() {
  const r = rng(1011);
  const shells = [
    { g: shell(r, 46, 1.95, 2.1, true, true), spin: new THREE.Vector3(0.02, 0.07, 0) },
    { g: shell(r, 38, 1.6, 1.8, false), spin: new THREE.Vector3(-0.05, 0, 0.04) },
    { g: shell(r, 22, 1.05, 1.3, true), spin: new THREE.Vector3(0, -0.09, 0.03) },
  ];
  const circ = circuits(r, 70, 1.9);
  const beam = beams(r);
  // Particles: shell dust, inner cloud, pads
  const targets = [];
  for (let i = 0; i < 2600; i++) targets.push(terrainAt(randomUnit(r), 1.85 + r() * 0.3));
  for (let i = 0; i < 500; i++) targets.push(randomUnit(r).multiplyScalar(0.4 + r() * 1.0));
  circ.pads.forEach((p) => targets.push(p));
  const dust = pointCloud(r, targets, 1.2, 3.6, 7);
  // Bokeh: big soft discs drifting in front of the lens
  const bokehTargets = [];
  for (let i = 0; i < 46; i++) bokehTargets.push(new THREE.Vector3((r() - 0.5) * 9, (r() - 0.5) * 6, 1.2 + r() * 3.2));
  const bokeh = pointCloud(r, bokehTargets, 8, 30, 3);
  return { shells, circuits: circ.geometry, beams: beam, dust, bokeh };
}

export const DUST_COLOR = GOLD.clone();
export const BOKEH_COLOR = EMBER.clone().lerp(GOLD, 0.5);

// Camera distance that keeps the whole sphere in frame on narrow screens (peaks reach r ≈ 2.35).
export const baseZFor = (aspect) => Math.max(8.2, 2.8 / (Math.tan(THREE.MathUtils.degToRad(20)) * aspect));

// Parallax, and the scroll flies the camera into the core. Aim below centre so the sphere rides
// above the greeting; straighten out while flying in. Wide screens: nearly centred (a touch high).
// Tall phones: raised above the greeting.
export function frameCamera(camera, baseZ, mouse, fly) {
  const a = camera.aspect;
  const lift = (a >= 1.3 ? 0.25 : a <= 0.6 ? 1.35 : 1.35 + ((a - 0.6) / 0.7) * (0.25 - 1.35)) * (1 - fly);
  camera.position.set(mouse.x * 0.6 * (1 - fly), -lift - mouse.y * 0.4 * (1 - fly), baseZ + (1.1 - baseZ) * fly);
  camera.lookAt(0, -lift, 0);
}
