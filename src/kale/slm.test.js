import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { answer, matchIntent } from "./intents";
import { createModel, pickAnswer, vet } from "./slm";

const cfg = JSON.parse(readFileSync("public/kale/slm.json", "utf8"));
const bin = readFileSync("public/kale/slm.bin");
const model = createModel(cfg, bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength));
const ref = JSON.parse(readFileSync("slm/reference.json", "utf8"));
const ask = (q) => vet(model.generate(q));
// What a visitor gets: the model, checked against the keyword rules (as in store.js).
const reply = (q) => pickAnswer(ask(q), matchIntent(q)) ?? answer(q);

describe("K.A.L.E. small language model", () => {
  it("matches PyTorch's logits for the same weights", () => {
    const js = model.logitsFor(`\x02${ref.q}\x03`);
    ref.logits.forEach((v, i) => expect(js[i]).toBeCloseTo(v, 1));
  });

  it("answers phrasings it never saw in training, with the right action", () => {
    expect(ask("could you share omkar's resume").action).toEqual({ type: "download" });
    expect(ask("what was the pneumonia paper about").action).toEqual({ type: "scroll", target: "#projects" });
    expect(ask("how can i get in touch with him").action).toEqual({ type: "scroll", target: "#contact" });
    expect(ask("tell me about his speech project").text).toMatch(/hour-long audio/);
  });

  it("lets the keyword rules overrule the model when it picks the wrong topic", () => {
    expect(reply("what's trihub").action).toEqual({ type: "scroll", target: "#lab" });
    expect(reply("what are his main skills").action).toEqual({ type: "scroll", target: "#expertise" });
    expect(reply("is he open to internships").action).toEqual({ type: "scroll", target: "#contact" });
    expect(reply("where did omkar go to college").action).toEqual({ type: "scroll", target: "#experience" });
  });

  it("declines off-topic questions instead of making things up", () => {
    const a = ask("who won the football world cup");
    expect(a?.action).toBeUndefined();
    expect(a?.text ?? "").toMatch(/can't help|only know/i);
  });

  it("never states the pneumonia numbers or claims two papers", () => {
    for (const q of ["pneumonia accuracy", "what auc did the xray model get", "how many papers", "research"]) {
      const a = ask(q);
      expect(a?.text ?? "").not.toMatch(/93%|0\.96|21,?293|two (published )?papers/i);
    }
  });
});

describe("vet", () => {
  const ok = { text: "Opening his LinkedIn in a new tab.", action: "open:linkedin", confidence: 0.99 };
  it("maps actions", () => {
    expect(vet(ok).action.type).toBe("open");
    expect(vet({ ...ok, action: "scroll:#projects" }).action).toEqual({ type: "scroll", target: "#projects" });
  });
  it("rejects low confidence, unknown numbers, banned claims and unknown targets", () => {
    expect(vet({ ...ok, confidence: 0.5 })).toBeNull();
    expect(vet({ ...ok, text: "It got 97.2% accuracy." })).toBeNull();
    expect(vet({ ...ok, text: "He has two published papers." })).toBeNull();
    expect(vet({ ...ok, action: "scroll:#nowhere" })).toBeNull();
  });
});
