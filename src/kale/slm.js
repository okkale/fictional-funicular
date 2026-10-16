// Kyle's small language model, run in the browser. A character-level GPT (about 0.8M
// parameters) trained on Omkar's portfolio by slm/train.py, shipped as float16 weights in
// public/kale/. Plain JavaScript forward pass with a KV cache: no runtime, no server.
//
// Generated text is vetted before it reaches the visitor (see `vet`); anything unsure falls back
// to the keyword rules in intents.js.
import { profile } from "../data";
import { SECTIONS } from "./intents";

const BOS = "\x02", SEP = "\x03", ACT = "\x04", EOS = "\x00";

function half(h) {
  const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
  if (e === 0) return s * 2 ** -14 * (f / 1024);
  if (e === 31) return f ? NaN : s * Infinity;
  return s * 2 ** (e - 15) * (1 + f / 1024);
}

// Build a model from its config (slm.json) and float16 weights (slm.bin, as an ArrayBuffer).
export function createModel(cfg, buffer) {
  const raw = new Uint16Array(buffer);
  const W = {};
  for (const t of cfg.tensors) {
    const n = t.shape.reduce((a, b) => a * b, 1);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = half(raw[t.offset + i]);
    W[t.name] = out;
  }
  const { d, n_layer: L, n_head: H, block, vocab } = cfg;
  const hd = d / H;
  const V = vocab.length;
  const stoi = new Map(vocab.map((c, i) => [c, i]));
  const space = stoi.get(" ");

  const linear = (w, b, x, nOut) => {
    const nIn = x.length, y = new Float32Array(nOut);
    for (let o = 0; o < nOut; o++) {
      let s = b ? b[o] : 0;
      const row = o * nIn;
      for (let i = 0; i < nIn; i++) s += w[row + i] * x[i];
      y[o] = s;
    }
    return y;
  };
  const norm = (x, g, b) => {
    let m = 0, v = 0;
    for (const a of x) m += a;
    m /= x.length;
    for (const a of x) v += (a - m) ** 2;
    const r = 1 / Math.sqrt(v / x.length + 1e-5);
    return x.map((a, i) => (a - m) * r * g[i] + b[i]);
  };
  const gelu = (x) => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));

  // One decoding step: feed token `id` at position `t`, return next-token logits.
  function step(id, t, cache) {
    let x = new Float32Array(d);
    for (let i = 0; i < d; i++) x[i] = W["tok.weight"][id * d + i] + W["pos.weight"][t * d + i];
    for (let l = 0; l < L; l++) {
      const p = `blocks.${l}.`;
      const qkv = linear(W[p + "qkv.weight"], W[p + "qkv.bias"], norm(x, W[p + "ln1.weight"], W[p + "ln1.bias"]), 3 * d);
      const c = cache[l];
      c.k.push(qkv.slice(d, 2 * d));
      c.v.push(qkv.slice(2 * d));
      const y = new Float32Array(d);
      for (let h = 0; h < H; h++) {
        const o = h * hd, scores = new Float32Array(c.k.length);
        let max = -Infinity;
        for (let j = 0; j < c.k.length; j++) {
          let s = 0;
          for (let i = 0; i < hd; i++) s += qkv[o + i] * c.k[j][o + i];
          scores[j] = s / Math.sqrt(hd);
          if (scores[j] > max) max = scores[j];
        }
        let sum = 0;
        for (let j = 0; j < scores.length; j++) sum += scores[j] = Math.exp(scores[j] - max);
        for (let j = 0; j < scores.length; j++) {
          const w = scores[j] / sum;
          for (let i = 0; i < hd; i++) y[o + i] += w * c.v[j][o + i];
        }
      }
      const a = linear(W[p + "proj.weight"], W[p + "proj.bias"], y, d);
      for (let i = 0; i < d; i++) x[i] += a[i];
      const m = linear(W[p + "fc.weight"], W[p + "fc.bias"], norm(x, W[p + "ln2.weight"], W[p + "ln2.bias"]), 4 * d).map(gelu);
      const f = linear(W[p + "out.weight"], W[p + "out.bias"], m, d);
      for (let i = 0; i < d; i++) x[i] += f[i];
    }
    return linear(W["tok.weight"], null, norm(x, W["ln.weight"], W["ln.bias"]), V);
  }

  const encode = (s) => [...s].map((ch) => stoi.get(ch) ?? space);
  const newCache = () => Array.from({ length: L }, () => ({ k: [], v: [] }));

  // Logits after reading `prompt` (used by the parity test against PyTorch).
  function logitsFor(prompt) {
    const ids = encode(prompt), cache = newCache();
    let logits;
    ids.forEach((id, t) => (logits = step(id, t, cache)));
    return logits;
  }

  // Greedy decoding. Returns the answer, its raw action and the model's confidence: the
  // geometric mean probability of the characters it chose.
  function generate(question) {
    const ids = encode(BOS + normalise(question).slice(0, 120) + SEP);
    const cache = newCache();
    let logits;
    ids.forEach((id, t) => (logits = step(id, t, cache)));
    let out = "", logp = 0, n = 0;
    for (let t = ids.length; t < block; t++) {
      let best = 0;
      for (let i = 1; i < V; i++) if (logits[i] > logits[best]) best = i;
      let z = 0;
      for (let i = 0; i < V; i++) z += Math.exp(logits[i] - logits[best]);
      logp -= Math.log(z);
      n++;
      const ch = vocab[best];
      if (ch === EOS) break;
      out += ch;
      logits = step(best, t, cache);
    }
    const [text, action = ""] = out.split(ACT);
    return { text: text.trim(), action: action.trim(), confidence: Math.exp(logp / Math.max(n, 1)) };
  }

  return { generate, logitsFor };
}

export const normalise = (q) => q.toLowerCase().replace(/’/g, "'").split(/\s+/).filter(Boolean).join(" ");

// Facts the model may state as numbers. Anything else means it blended answers: reject.
const NUMBERS = new Set(["94.6%", "94.6", "0.93", "32,000+", "32,000", "3000+", "3000", "40%", "5+", "6", "8", "2023", "2025", "2026", "2027"]);
const BANNED = /93%|0\.96|21,?293|two (published )?papers|co-authored paper/i;
export const MIN_CONFIDENCE = 0.9;

// Turn a raw generation into { text, action? }, or null when it shouldn't be shown.
export function vet({ text, action, confidence }) {
  if (confidence < MIN_CONFIDENCE || text.length < 8 || BANNED.test(text)) return null;
  for (const num of text.match(/(?<![\w.])\d[\d,.]*[%+]?/g) || []) if (!NUMBERS.has(num.replace(/[.,]$/, ""))) return null;
  if (!action) return { text };
  if (action === "download") return { text, action: { type: "download" } };
  if (action === "open:github") return { text, action: { type: "open", target: profile.github } };
  if (action === "open:linkedin") return { text, action: { type: "open", target: profile.linkedin } };
  const target = action.startsWith("scroll:") && action.slice(7);
  if (target && SECTIONS.includes(target)) return { text, action: { type: "scroll", target } };
  return null;
}

const where = (a) => (a?.action ? `${a.action.type}:${a.action.target ?? ""}` : "");
export const isDecline = (a) => /can't help with/.test(a?.text ?? "");

// Choose between the model's answer and the keyword rule's. A model this small has no general
// English behind it and can be confidently wrong about the topic, so the rules act as a check:
// when both point somewhere and disagree, the rule wins; the model keeps the answers rules can't
// give (details, small talk, declining off-topic questions) and its own wording when they agree.
export function pickAnswer(model, rule) {
  if (!model) return rule;
  if (isDecline(model)) return rule ?? model;
  if (rule && model.action && where(model) !== where(rule)) return rule;
  return model;
}

// Browser loader: starts the worker and fetches the weights once, on first use. Resolves to
// { generate(q) -> Promise }, or null when the model can't run here.
let pending = null;
export function loadModel() {
  if (typeof Worker === "undefined") return Promise.resolve(null);
  pending ??= new Promise((resolve) => {
    const worker = new Worker(new URL("./slm.worker.js", import.meta.url), { type: "module" });
    const calls = new Map();
    let next = 0;
    const call = (msg) =>
      new Promise((res, rej) => {
        const id = next++;
        calls.set(id, { res, rej });
        worker.postMessage({ ...msg, id });
      });
    worker.onmessage = ({ data }) => {
      const c = calls.get(data.id);
      calls.delete(data.id);
      data.ok ? c?.res(data.result) : c?.rej(new Error(data.error));
    };
    worker.onerror = () => resolve(null);
    call({ type: "load" }).then(
      () => resolve({ generate: (q) => call({ type: "generate", q }) }),
      () => resolve(null),
    );
  }).then((m) => (m || (pending = null), m));
  return pending;
}
