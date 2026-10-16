import { describe, expect, it } from "vitest";
import { answer, SECTIONS, TOURS } from "./intents";

const PNEUMONIA_NUMBERS = /93%|0\.96|21,?293/;

describe("K.A.L.E. intents", () => {
  it("introduces itself on a greeting", () => {
    expect(answer("hello").text).toContain("K.A.L.E.");
  });

  it("routes pneumonia questions to projects, as a published paper, without quoting results", () => {
    const a = answer("tell me about the pneumonia paper");
    expect(a.action).toEqual({ type: "scroll", target: "#projects" });
    expect(a.text).toMatch(/published/i);
    expect(a.text).not.toMatch(PNEUMONIA_NUMBERS);
  });

  it("presents academic risk as a project whose paper is in progress, never as published", () => {
    const a = answer("temporal transformer");
    expect(a.action).toEqual({ type: "scroll", target: "#projects" });
    expect(a.text).toMatch(/in progress/i);
    for (const q of ["research", "papers", "projects", "temporal transformer", "hello", "help"]) {
      expect(answer(q).text).not.toMatch(/two (published )?papers|co-authored paper/i);
    }
  });

  it("routes skill questions to the expertise section", () => {
    expect(answer("what are his skills").action).toEqual({ type: "scroll", target: "#expertise" });
  });

  it("downloads the résumé", () => {
    expect(answer("can I get his resume").action.type).toBe("download");
  });

  it("no longer offers themes", () => {
    const a = answer("switch theme");
    expect(a.action?.type).not.toBe("theme");
    expect(a.text.toLowerCase()).toContain("tour");
  });

  it("falls back to listing topics and offering the tour", () => {
    const a = answer("asdfgh");
    expect(a.text.toLowerCase()).toContain("tour");
    expect(a.action).toBeUndefined();
  });

  it("ignores empty input", () => {
    expect(answer("   ")).toBeNull();
  });
});

describe("tours", () => {
  it("has the three visitor paths", () => {
    expect(Object.keys(TOURS).sort()).toEqual(["engineer", "explore", "recruiter"]);
  });

  it("only targets sections that exist on the page", () => {
    for (const steps of Object.values(TOURS)) {
      expect(steps.length).toBeGreaterThan(1);
      for (const s of steps) {
        expect(SECTIONS).toContain(s.target);
        if (s.through) expect(SECTIONS).toContain(s.through);
        expect(s.line).not.toMatch(PNEUMONIA_NUMBERS);
      }
    }
  });

  it("gives every stop a title and a narration line", () => {
    for (const steps of Object.values(TOURS)) {
      for (const s of steps) {
        expect(s.title.length).toBeGreaterThan(2);
        expect(s.line.length).toBeGreaterThan(40);
      }
    }
  });

  it("walks recruiters through expertise and shipped systems", () => {
    const targets = TOURS.recruiter.map((s) => s.target);
    expect(targets).toEqual(expect.arrayContaining(["#expertise", "#lab", "#contact"]));
  });

  it("tours say projects, and never claim two published papers", () => {
    for (const steps of Object.values(TOURS)) {
      for (const s of steps) {
        expect(s.target).not.toBe("#research");
        expect(`${s.title} ${s.line}`).not.toMatch(/two papers|co-author|IRIS/i);
      }
    }
  });
});
