import { useEffect, useRef } from "react";
import * as THREE from "three";
import { level } from "./voice";
import { onLiteChange, perf } from "../perf";
import { BOKEH_COLOR, DUST_COLOR, RINGS, baseZFor, buildModel, ease, frameCamera } from "./sphereModel";

/*
  The same Kyle sphere as Sphere.jsx, drawn with canvas 2D for browsers without WebGL (hardware
  acceleration off, blocked GPU). Same model, same motion, same camera fly-in; three.js is used
  for maths only. The vertices are projected on the CPU and the lines are stroked in batches of
  equal colour, so each frame is a few dozen draw calls. Bloom is faked by drawing a downscaled
  copy of the frame back over itself.

  Same props as Sphere.
*/

// The model's colours are linear (three.js colour management); a canvas wants sRGB. Converting
// keeps this version the same gold as the WebGL one instead of a darker orange.
const srgb = (x) => {
  x = Math.min(1, Math.max(0, x));
  return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);
};
const rgb = (c, k = 1) => `rgb(${srgb(c.r * k)},${srgb(c.g * k)},${srgb(c.b * k)})`;

// Group a line geometry's segments by colour so each colour is one path and one stroke.
function batches(geometry) {
  const col = geometry.attributes.color.array;
  const map = new Map();
  for (let s = 0; s < col.length / 6; s++) {
    const r = col[s * 6], g = col[s * 6 + 1], b = col[s * 6 + 2];
    const key = `${Math.round(r * 24)},${Math.round(g * 24)},${Math.round(b * 24)}`;
    if (!map.has(key)) map.set(key, { style: `rgb(${srgb(r)},${srgb(g)},${srgb(b)})`, segs: [] });
    map.get(key).segs.push(s);
  }
  return [...map.values()];
}

function sprite(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  stops.forEach(([o, s]) => g.addColorStop(o, s));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return c;
}

export default function Sphere2D({ progress = null, boot = true, bootMs = 2800, reduce = false, className = "" }) {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = canvas.style.height = "100%";
    el.appendChild(canvas);
    const ctx = canvas.getContext("2d", { alpha: false });
    // Fake bloom: two downscaled copies, upscaled back with smoothing, read as a soft glow.
    const small = [document.createElement("canvas"), document.createElement("canvas")];
    const sctx = small.map((c) => c.getContext("2d"));

    const model = buildModel();
    const root = new THREE.Group();
    const lines = [
      ...model.shells.map(({ g, spin }) => ({ g, spin, obj: new THREE.Object3D() })),
      { g: model.circuits, obj: new THREE.Object3D() },
      { g: model.beams, obj: new THREE.Object3D() },
    ];
    lines.forEach((l) => {
      root.add(l.obj);
      l.batches = batches(l.g);
      l.n = l.g.attributes.position.count;
      l.sx = new Float32Array(l.n);
      l.sy = new Float32Array(l.n);
      l.ok = new Uint8Array(l.n);
    });
    const scene = new THREE.Scene();
    scene.add(root);
    const bokehObj = new THREE.Object3D();
    scene.add(bokehObj);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    const ringRot = RINGS.map(() => 0);
    const glowSprite = sprite([[0, "rgba(255,244,222,1)"], [0.25, "rgba(255,180,80,0.45)"], [1, "rgba(255,130,40,0)"]]);
    const bokehSprite = sprite([[0, rgb(BOKEH_COLOR)], [0.7, rgb(BOKEH_COLOR)], [1, "rgba(0,0,0,0)"]]);
    const dustStyle = rgb(DUST_COLOR);
    const mvp = new THREE.Matrix4();
    const viewProj = new THREE.Matrix4();
    const v = new THREE.Vector3();

    let dpr = 1;
    let W = 1, H = 1, baseZ = 8.2;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      W = canvas.width = Math.round(w * dpr);
      H = canvas.height = Math.round(h * dpr);
      small[0].width = Math.ceil(W / 4);
      small[0].height = Math.ceil(H / 4);
      small[1].width = Math.ceil(W / 10);
      small[1].height = Math.ceil(H / 10);
      camera.aspect = w / h;
      baseZ = baseZFor(camera.aspect);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(performance.now());
    });
    ro.observe(el);
    const stopLite = onLiteChange(() => {
      resize();
      if (reduce) frame(performance.now());
    });

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Project a point through the current mvp; returns [x, y, w] in canvas pixels, or null behind the lens.
    const project = (m, x, y, z) => {
      const e = m.elements;
      const w = e[3] * x + e[7] * y + e[11] * z + e[15];
      if (w < 0.06) return null;
      return [((e[0] * x + e[4] * y + e[8] * z + e[12]) / w * 0.5 + 0.5) * W, (0.5 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w * 0.5) * H, w];
    };

    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    let running = true;
    let smoothLevel = 0;

    function frame(now) {
      // Everything here runs on the CPU: hold 30 fps (24 in lite).
      if (!reduce && now - last < (perf.lite ? 40 : 30)) {
        if (running) raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = reduce ? 4 : (now - t0) / 1000;
      const b = !boot || reduce ? 1 : ease((now - t0) / bootMs);
      const p = progress ? progress.get() : 0;
      if (p >= 0.995) {
        if (!reduce && running) raf = requestAnimationFrame(frame);
        return;
      }
      smoothLevel += (level.value - smoothLevel) * 0.25;
      const lv = smoothLevel;
      const fly = ease(p);

      if (!reduce) {
        for (const l of lines) {
          if (!l.spin) continue;
          l.obj.rotation.x += l.spin.x * dt;
          l.obj.rotation.y += l.spin.y * dt;
          l.obj.rotation.z += l.spin.z * dt;
        }
        root.rotation.y += dt * (0.06 + p * 0.5);
        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;
        bokehObj.position.x = Math.sin(t * 0.07) * 0.4 - mouse.x * 0.6;
        bokehObj.position.y = Math.cos(t * 0.05) * 0.3 + mouse.y * 0.4;
      }
      root.rotation.x = 0.25 + mouse.y * 0.2;
      frameCamera(camera, baseZ, mouse, fly);
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
      viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // Filaments, drawn on during boot
      ctx.lineWidth = Math.max(1, dpr);
      // Lines add up faster on a canvas (sRGB) than in WebGL (linear): draw them dimmer to match.
      ctx.globalAlpha = Math.min(1, b * 1.2) * 0.55;
      for (const l of lines) {
        mvp.multiplyMatrices(viewProj, l.obj.matrixWorld);
        const e = mvp.elements;
        const pos = l.g.attributes.position.array;
        const limit = Math.floor((l.n * b) / 2) * 2;
        for (let i = 0; i < limit; i++) {
          const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
          const w = e[3] * x + e[7] * y + e[11] * z + e[15];
          if (w < 0.06) {
            l.ok[i] = 0;
            continue;
          }
          l.ok[i] = 1;
          l.sx[i] = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / w * 0.5 + 0.5) * W;
          l.sy[i] = (0.5 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w * 0.5) * H;
        }
        for (const bt of l.batches) {
          ctx.beginPath();
          for (const s of bt.segs) {
            const i = s * 2;
            if (i + 1 >= limit) break;
            if (!l.ok[i] || !l.ok[i + 1]) continue;
            ctx.moveTo(l.sx[i], l.sy[i]);
            ctx.lineTo(l.sx[i + 1], l.sy[i + 1]);
          }
          ctx.strokeStyle = bt.style;
          ctx.stroke();
        }
      }

      // Dust: assembles from the scattered cloud, twinkles, swells with the voice
      mvp.multiplyMatrices(viewProj, root.matrixWorld);
      {
        const d = model.dust.attributes;
        const pos = d.position.array, sc = d.aScatter.array, size = d.aSize.array, seed = d.aSeed.array;
        const buckets = [[], [], [], [], [], []];
        for (let i = 0; i < size.length; i++) {
          let pb = Math.min(1, Math.max(0, (b - seed[i] * 0.35) / 0.65));
          pb = 1 - Math.pow(1 - pb, 3);
          if (pb <= 0) continue;
          const px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2];
          v.set(sc[i * 3] + (px - sc[i * 3]) * pb, sc[i * 3 + 1] + (py - sc[i * 3 + 1]) * pb, sc[i * 3 + 2] + (pz - sc[i * 3 + 2]) * pb);
          const len = Math.hypot(px, py, pz) || 1;
          const wob = Math.sin(t * 1.3 + seed[i] * 40) * 0.018;
          const q = project(mvp, v.x + (px / len) * wob, v.y + (py / len) * wob, v.z + (pz / len) * wob);
          if (!q) continue;
          const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + seed[i] * 3) + seed[i] * 90);
          const a = Math.min(1, tw * pb * (0.7 + lv * 0.9) * 0.75);
          const s = Math.max(0.8, (size[i] * dpr * (1 + lv * 0.5) * 6) / Math.max(0.4, q[2])) * 0.7;
          buckets[Math.min(5, Math.floor(a * 6))].push(q[0] - s / 2, q[1] - s / 2, s);
        }
        ctx.fillStyle = dustStyle;
        buckets.forEach((bk, k) => {
          if (!bk.length) return;
          ctx.globalAlpha = (k + 0.5) / 6;
          ctx.beginPath();
          for (let j = 0; j < bk.length; j += 3) ctx.rect(bk[j], bk[j + 1], bk[j + 2], bk[j + 2]);
          ctx.fill();
        });
      }

      // Core: rings facing the viewer, spinning, swelling with the voice; fades as the camera flies in
      const pulse = 1 + 0.04 * Math.sin(t * 2.1) + lv * 0.28;
      const cs = ease(b * 1.4) * pulse;
      if (cs > 0) {
        RINGS.forEach(([rad, tube, arc, c, o, z], i) => {
          ringRot[i] += (i % 2 ? -1 : 1) * dt * (0.2 + i * 0.12);
          const cq = project(viewProj, 0, 0, z * cs);
          const eq = project(viewProj, rad * cs, 0, z * cs);
          if (!cq || !eq) return;
          const R = Math.hypot(eq[0] - cq[0], eq[1] - cq[1]);
          ctx.globalAlpha = o * (1 - fly * 0.7);
          ctx.strokeStyle = rgb(c);
          ctx.lineWidth = Math.max(1, (R / rad) * tube * 2);
          ctx.beginPath();
          ctx.arc(cq[0], cq[1], R, -ringRot[i], -ringRot[i] - arc, true);
          ctx.stroke();
        });
        const gq = project(viewProj, 0, 0, 0);
        const ge = project(viewProj, 0.4 * cs, 0, 0);
        if (gq && ge) {
          const G = Math.hypot(ge[0] - gq[0], ge[1] - gq[1]);
          ctx.globalAlpha = Math.min(1, (0.22 + lv * 0.3) * (1 - fly * 0.95));
          ctx.drawImage(glowSprite, gq[0] - G, gq[1] - G, G * 2, G * 2);
        }
      }

      // Bokeh: big soft discs in front of the lens
      mvp.multiplyMatrices(viewProj, bokehObj.matrixWorld);
      {
        const d = model.bokeh.attributes;
        const pos = d.position.array, size = d.aSize.array, seed = d.aSeed.array;
        for (let i = 0; i < size.length; i++) {
          let pb = Math.min(1, Math.max(0, (b - seed[i] * 0.35) / 0.65));
          pb = 1 - Math.pow(1 - pb, 3);
          const q = project(mvp, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          if (!q || pb <= 0) continue;
          const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + seed[i] * 3) + seed[i] * 90);
          const s = (size[i] * dpr * (1 + lv * 0.5) * 6) / Math.max(0.4, q[2]);
          ctx.globalAlpha = Math.min(1, tw * pb * (0.7 + lv * 0.9) * 0.035 * 4);
          ctx.drawImage(bokehSprite, q[0] - s / 2, q[1] - s / 2, s, s);
        }
      }

      // Bloom
      const strength = (0.32 + lv * 0.35) * (1 - fly * 0.5) * Math.min(1, b * 1.5);
      sctx[0].globalCompositeOperation = "copy";
      sctx[0].drawImage(canvas, 0, 0, small[0].width, small[0].height);
      sctx[1].globalCompositeOperation = "copy";
      sctx[1].drawImage(small[0], 0, 0, small[1].width, small[1].height);
      ctx.imageSmoothingEnabled = true;
      // Lite: a faint halo only, so the lines stay crisp.
      const halo = perf.lite ? 0.35 : 1;
      ctx.globalAlpha = Math.min(1, strength * 0.8 * halo);
      ctx.drawImage(small[0], 0, 0, W, H);
      ctx.globalAlpha = Math.min(1, strength * 1.2 * halo);
      ctx.drawImage(small[1], 0, 0, W, H);

      if (!reduce && running) raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting && !document.hidden;
      if (vis && !running) {
        running = true;
        last = performance.now() - 50;
        raf = requestAnimationFrame(frame);
      } else if (!vis) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);
    last = t0 - 50;
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      stopLite();
      window.removeEventListener("pointermove", onMove);
      canvas.remove();
    };
  }, [boot, bootMs, reduce, progress]);

  return <div ref={host} className={className} aria-hidden />;
}
