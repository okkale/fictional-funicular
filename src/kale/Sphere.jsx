import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { level } from "./voice";
import { fpsGuard, onLiteChange, perf, setLite } from "../perf";
import { BOKEH_COLOR, DUST_COLOR, RINGS, baseZFor, buildModel, ease, frameCamera } from "./sphereModel";

/*
  Kyle's body: a warm gold holographic sphere of light filaments. Original construction, built
  procedurally from a fixed seed (sphereModel.js):
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
  Lite mode (src/perf.js) keeps the same picture at full sharpness but switches the bloom pass off
  (the costly part); the filaments are drawn a little brighter instead so they still read as
  light, with a 30 fps cap. It still renders through the composer, so light adds up in linear
  space and is converted once at the end: the same gold as full mode, not a darker orange. It switches on for software WebGL, and mid-flight when the frame
  rate sags, without rebuilding the scene.
*/

function lineMaterial() {
  return new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
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
    // No GPU (hardware acceleration off): WebGL runs on the CPU, so go lite from the first frame.
    const gl = renderer.getContext();
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))) setLite(true);
    let lite = perf.lite;
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 1.25);
    let dpr = pixelRatio();
    renderer.setPixelRatio(dpr);
    renderer.setClearColor("#000000", 1);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    const model = buildModel();
    const disposables = [];
    const track = (o) => (disposables.push(o), o);

    // Rotating body
    const root = new THREE.Group();
    scene.add(root);
    const shells = model.shells.map(({ g, spin }) => {
      const line = new THREE.LineSegments(track(g), track(lineMaterial()));
      line.userData.spin = spin;
      line.userData.count = g.attributes.position.count;
      root.add(line);
      return line;
    });
    const circuitLines = new THREE.LineSegments(track(model.circuits), track(lineMaterial()));
    circuitLines.userData.count = model.circuits.attributes.position.count;
    root.add(circuitLines);
    const beamLines = new THREE.LineSegments(track(model.beams), track(lineMaterial()));
    beamLines.userData.count = model.beams.attributes.position.count;
    root.add(beamLines);
    const allLines = [...shells, circuitLines, beamLines];
    // Lite has no bloom: lift the filaments and dust so they keep their brightness, crisp.
    const liteGain = () => {
      allLines.forEach((l) => l.material.color.setScalar(lite ? 1.3 : 1));
      dustMat.uniforms.uGain.value = lite ? 0.9 : 0.75;
      bloom.enabled = !lite;
    };

    const dustMat = track(pointsMaterial(DUST_COLOR.clone(), 0.0, 0.75));
    const dust = new THREE.Points(track(model.dust), dustMat);
    root.add(dust);

    const bokehMat = track(pointsMaterial(BOKEH_COLOR.clone(), 0.15, 0.035));
    const bokeh = new THREE.Points(track(model.bokeh), bokehMat);
    scene.add(bokeh);

    // Core: tunnel of rings facing the viewer, plus a hot glow sprite
    const core = new THREE.Group();
    scene.add(core);
    const ringMat = (c, o) => track(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
    const rings = RINGS.map(([rad, tube, arc, c, o, z]) => {
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
    liteGain();
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
      baseZ = baseZFor(camera.aspect);
      camera.updateProjectionMatrix();
      dustMat.uniforms.uPixel.value = dpr;
      bokehMat.uniforms.uPixel.value = dpr;
    };
    resize();
    const stopLite = onLiteChange((on) => {
      lite = on;
      liteGain();
      dpr = pixelRatio();
      renderer.setPixelRatio(dpr);
      resize();
      if (reduce) frame(performance.now());
    });
    const guard = fpsGuard();
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
      // Lite: hold 30 fps; the skipped frames cost nothing.
      if (lite && !reduce && now - last < 30) {
        if (running) raf = requestAnimationFrame(frame);
        return;
      }
      if (!reduce) guard(now - last);
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
      glow.material.opacity = (0.22 + lv * 0.3) * (1 - fly * 0.95) * (lite ? 0.55 : 1);
      rings.forEach((m) => (m.material.opacity = m.userData.o * (1 - fly * 0.7)));

      frameCamera(camera, baseZ, mouse, fly);
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
      stopLite();
      window.removeEventListener("pointermove", onMove);
      disposables.forEach((d) => d.dispose?.());
      composer.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [boot, bootMs, reduce, progress, onFail]);

  return <div ref={host} className={className} aria-hidden />;
}
