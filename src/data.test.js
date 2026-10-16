import { describe, expect, it } from "vitest";
import * as data from "./data";

describe("site data", () => {
  it("never shows the pneumonia paper's results", () => {
    const all = JSON.stringify(data);
    for (const banned of ["93%", "~93", "0.960", "21,293", "21293"]) expect(all).not.toContain(banned);
    expect(data.xaiPaper.figures).toBeUndefined();
  });

  it("keeps academic risk as a project with its paper in progress", () => {
    const p = data.projects.find((x) => x.title === "Academic risk prediction");
    expect(p.status).toBe("Paper in progress");
    expect(JSON.stringify(data)).not.toMatch(/two (research )?papers/i);
  });

  it("does not list the pneumonia work twice", () => {
    expect(data.projects.some((p) => /x-ray|pneumonia/i.test(p.title))).toBe(false);
  });

  it("gives every project an input, model and output", () => {
    for (const p of data.projects) {
      expect(p.scan).toEqual({ input: expect.any(String), model: expect.any(String), output: expect.any(String) });
    }
  });

  it("keeps ERP stages well formed", () => {
    for (const m of data.erpPipeline) {
      expect(m).toEqual(expect.objectContaining({ id: expect.any(String), label: expect.any(String), detail: expect.any(String) }));
    }
  });
});
