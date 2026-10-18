// Runs Kyle's model off the main thread, so decoding never stalls scrolling or the HUD.
import { createModel } from "./slm";

let model = null;
const ready = Promise.all([fetch("/kale/slm.json").then((r) => r.json()), fetch("/kale/slm.bin").then((r) => r.arrayBuffer())]).then(
  ([cfg, buf]) => (model = createModel(cfg, buf)),
);

self.onmessage = async ({ data }) => {
  try {
    await ready;
    if (data.type === "load") self.postMessage({ id: data.id, ok: true });
    else self.postMessage({ id: data.id, ok: true, result: model.generate(data.q) });
  } catch (e) {
    self.postMessage({ id: data.id, ok: false, error: String(e) });
  }
};
