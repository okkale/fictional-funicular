import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { level } from "./voice";

/*
  K.A.L.E.'s body: a warm gold holographic sphere of light filaments. Original construction, built
  procedurally from a fixed seed:
    · filament shells: partial great-circle arcs on three nested shells, each shell on its own spin
    · circuit traces: Manhattan-style paths walked across the surface, with solder pads
    · spokes and chords: long straight beams through and out of the sphere
    · terrain: a noise field acts as continents on the outer shell, like a dry globe. Ocean
      basins sit just inside the surface, land rises gently, and only the highest ranges break
      out past the silhouette. Inner shells stay perfectly round.
    · core: a tunnel of rings facing the viewer, with a hot glow
    · particles that assemble from a scattered cloud on boot, plus out-of-focus bokeh
  Bloom turns all of it into light. Voice level swells the core and the glow.

  Props: progress (MotionValue 0..1, landing scroll; the camera flies into the core),
  boot (assemble on mount), bootMs, reduce (draw one still frame), onFail (WebGL unavailable).
*/

const GOLD = new THREE.Color("#ffb648"); // warm gold filament
const HOT = new THREE.Color("#ffe6b8"); // hot core
const EMBER = new THREE.Color("#ff8a2a"); // ember orange
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
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

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

function lineMaterial() {
  return new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
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

const POINT_VERT = /* glsl */ `
  uniform float uTime, uBoot, uLevel, uPixel;
  attribute vec3 aScatter;
  attribute float aSize, aSeed;
  varying float vAlpha;
  void main() {
    float b = clamp((uBoot - aSeed * 0.35) / 0.65, 0.0, 1.0);
    b = 1.0 - pow(1.0 - b, 3.0);
    vec3 p = mix(aScatter, position, b);
    p += normalize(position + 1e-4) * sin(uTime * 1.3 + aSeed * 40.0) * 0.018;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 3.0) + aSeed * 90.0);
    vAlpha = tw * b * (0.7 + uLevel * 0.9);
    gl_PointSize = aSize * uPixel * (1.0 + uLevel * 0.5) * (6.0 / max(0.4, -mv.z));
  }
`;
const POINT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uSoft, uGain;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, uSoft, d);
    gl_FragColor = vec4(uColor * a * vAlpha * uGain, 1.0);
  }
`;

function pointsMaterial(color, soft, gain) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBoot: { value: 0 }, uLevel: { value: 0 }, uPixel: { value: 1 }, uColor: { value: color }, uSoft: { value: soft }, uGain: { value: gain } },
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
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

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,244,222,1)");
  g.addColorStop(0.25, "rgba(255,180,80,0.45)");
  g.addColorStop(1, "rgba(255,130,40,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export default function Sphere({ progress = null, boot = true, bootMs = 2800, reduce = false, onFail, className = "" }) {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch (e) {
      onFail?.();
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor("#000000", 1);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    const r = rng(1011);
    const disposables = [];
    const track = (o) => (disposables.push(o), o);

    // Rotating body
    const root = new THREE.Group();
    scene.add(root);
    const shells = [
      { g: shell(r, 46, 1.95, 2.1, true, true), spin: new THREE.Vector3(0.02, 0.07, 0) },
      { g: shell(r, 38, 1.6, 1.8, false), spin: new THREE.Vector3(-0.05, 0, 0.04) },
      { g: shell(r, 22, 1.05, 1.3, true), spin: new THREE.Vector3(0, -0.09, 0.03) },
    ].map(({ g, spin }) => {
      const line = new THREE.LineSegments(track(g), track(lineMaterial()));
      line.userData.spin = spin;
      line.userData.count = g.attributes.position.count;
      root.add(line);
      return line;
    });
    const circ = circuits(r, 70, 1.9);
    const circuitLines = new THREE.LineSegments(track(circ.geometry), track(lineMaterial()));
    circuitLines.userData.count = circ.geometry.attributes.position.count;
    root.add(circuitLines);
    const beamLines = new THREE.LineSegments(track(beams(r)), track(lineMaterial()));
    beamLines.userData.count = beamLines.geometry.attributes.position.count;
    root.add(beamLines);
    const allLines = [...shells, circuitLines, beamLines];

    // Particles: shell dust, pads, inner cloud
    const targets = [];
    for (let i = 0; i < 2600; i++) targets.push(terrainAt(randomUnit(r), 1.85 + r() * 0.3));
    for (let i = 0; i < 500; i++) targets.push(randomUnit(r).multiplyScalar(0.4 + r() * 1.0));
    circ.pads.forEach((p) => targets.push(p));
    const dustMat = track(pointsMaterial(GOLD.clone(), 0.0, 0.75));
    const dust = new THREE.Points(track(pointCloud(r, targets, 1.2, 3.6, 7)), dustMat);
    root.add(dust);

    // Bokeh: big soft discs drifting in front of the lens
    const bokehTargets = [];
    for (let i = 0; i < 46; i++) bokehTargets.push(new THREE.Vector3((r() - 0.5) * 9, (r() - 0.5) * 6, 1.2 + r() * 3.2));
    const bokehMat = track(pointsMaterial(EMBER.clone().lerp(GOLD, 0.5), 0.15, 0.035));
    const bokeh = new THREE.Points(track(pointCloud(r, bokehTargets, 8, 30, 3)), bokehMat);
    scene.add(bokeh);

    // Core: tunnel of rings facing the viewer, plus a hot glow sprite
    const core = new THREE.Group();
    scene.add(core);
    const ringMat = (c, o) => track(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
    const rings = [
      [0.34, 0.03, Math.PI * 2, HOT, 0.75, 0],
      [0.22, 0.022, Math.PI * 2, GOLD, 0.6, -0.25],
      [0.13, 0.016, Math.PI * 2, GOLD, 0.5, -0.5],
      [0.48, 0.008, Math.PI * 2, GOLD, 0.8, 0.02],
      [0.62, 0.012, Math.PI * 1.35, GOLD, 0.9, 0.04],
      [0.74, 0.006, Math.PI * 0.8, HOT, 0.8, 0.05],
    ].map(([rad, tube, arc, c, o, z]) => {
      const m = new THREE.Mesh(track(new THREE.TorusGeometry(rad, tube, 12, 120, arc)), ringMat(c, o));
      m.position.z = z;
      m.userData.o = o;
      core.add(m);
      return m;
    });
    const glowTex = track(glowTexture());
    const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    glow.scale.setScalar(0.8);
    core.add(glow);

    // Post: bloom turns lines into light
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.2, 0.3);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    let baseZ = 7;
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      composer.setSize(w, h);
      // Bloom at half resolution: it is a soft edge glow, so the cost drops ~4x with no visible loss.
      bloom.setSize(Math.round((w * dpr) / 2), Math.round((h * dpr) / 2));
      camera.aspect = w / h;
      // Keep the whole sphere in frame on narrow screens.
      baseZ = Math.max(8.2, 2.8 / (Math.tan(THREE.MathUtils.degToRad(20)) * camera.aspect)); // peaks reach r ≈ 2.35
      camera.updateProjectionMatrix();
      dustMat.uniforms.uPixel.value = dpr;
      bokehMat.uniforms.uPixel.value = dpr;
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(performance.now());
    });
    ro.observe(el);

    // Pointer parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    let running = true;
    let smoothLevel = 0;

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = reduce ? 4 : (now - t0) / 1000;
      const b = !boot || reduce ? 1 : ease((now - t0) / bootMs);
      const p = progress ? progress.get() : 0;
      if (p >= 0.995) {
        // Fully dissolved behind page 2: keep the loop alive but skip the GPU work.
        if (!reduce && running) raf = requestAnimationFrame(frame);
        return;
      }
      smoothLevel += (level.value - smoothLevel) * 0.25;
      const lv = smoothLevel;

      // Lines draw on during boot
      for (const l of allLines) {
        const n = l.userData.count;
        l.geometry.setDrawRange(0, Math.floor((n * b) / 2) * 2);
        l.material.opacity = Math.min(1, b * 1.2);
        if (l.userData.spin && !reduce) {
          l.rotation.x += l.userData.spin.x * dt;
          l.rotation.y += l.userData.spin.y * dt;
          l.rotation.z += l.userData.spin.z * dt;
        }
      }
      for (const m of [dustMat, bokehMat]) {
        m.uniforms.uTime.value = t;
        m.uniforms.uBoot.value = b;
        m.uniforms.uLevel.value = lv;
      }

      if (!reduce) {
        root.rotation.y += dt * (0.06 + p * 0.5);
        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;
        bokeh.position.x = Math.sin(t * 0.07) * 0.4 - mouse.x * 0.6;
        bokeh.position.y = Math.cos(t * 0.05) * 0.3 + mouse.y * 0.4;
      }
      root.rotation.x = 0.25 + mouse.y * 0.2;

      // Core: spins, swells with voice, and dims as the camera flies in (no white-out).
      const fly = ease(p);
      const pulse = 1 + 0.04 * Math.sin(t * 2.1) + lv * 0.28;
      core.scale.setScalar(ease(b * 1.4) * pulse);
      rings.forEach((m, i) => {
        m.rotation.z += (i % 2 ? -1 : 1) * dt * (0.2 + i * 0.12);
      });
      glow.material.opacity = (0.22 + lv * 0.3) * (1 - fly * 0.95);
      rings.forEach((m) => (m.material.opacity = m.userData.o * (1 - fly * 0.7)));

      // Camera: parallax, and the scroll flies it into the core
      // Aim below centre so the sphere rides above the greeting; straighten out while flying in.
      // Wide screens: nearly centred (a touch high). Tall phones: raised above the greeting.
      const a = camera.aspect;
      const lift = (a >= 1.3 ? 0.25 : a <= 0.6 ? 1.35 : 1.35 + ((a - 0.6) / 0.7) * (0.25 - 1.35)) * (1 - fly);
      camera.position.set(mouse.x * 0.6 * (1 - fly), -lift - mouse.y * 0.4 * (1 - fly), baseZ + (1.1 - baseZ) * fly);
      camera.lookAt(0, -lift, 0);
      bloom.strength = (0.32 + lv * 0.35) * (1 - fly * 0.5) * Math.min(1, b * 1.5);

      composer.render(dt);
      if (!reduce && running) raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting && !document.hidden;
      if (vis && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!vis) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      disposables.forEach((d) => d.dispose?.());
      composer.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [boot, bootMs, reduce, progress, onFail]);

  return <div ref={host} className={className} aria-hidden />;
}
