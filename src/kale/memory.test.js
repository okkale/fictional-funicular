import { beforeEach, describe, expect, it } from "vitest";
import {
  alterAnswer,
  clearMemory,
  findLearnedAnswer,
  getMemoryStats,
  MEMORY_LIMITS,
  recordInteraction,
  teachFact,
  toggleLearning,
} from "./memory";

describe("Kyle self-learning and conversational memory", () => {
  beforeEach(() => {
    clearMemory();
  });

  it("extracts and retains visitor profile from conversation turns", () => {
    recordInteraction("you", "Hi! My name is Sarah and I'm a recruiter from Stripe.");
    const stats = getMemoryStats();
    expect(stats.profile.name).toBe("Sarah");
    expect(stats.profile.company).toBe("Stripe");
    expect(stats.profile.role).toBe("Recruiter");

    const reply = findLearnedAnswer("what is my name?");
    expect(reply.text).toContain("Sarah");
    expect(reply.text).toContain("Stripe");
  });

  it("enforces conversational turn limits (rolling FIFO)", () => {
    for (let i = 0; i < MEMORY_LIMITS.MAX_TURNS + 10; i++) {
      recordInteraction("you", `Message ${i}`);
    }
    const stats = getMemoryStats();
    expect(stats.turnsCount).toBe(MEMORY_LIMITS.MAX_TURNS);
  });

  it("auto-learns facts when instructed via conversation", () => {
    recordInteraction("you", "Remember that Omkar is giving a guest lecture on explainable AI next week.");
    const stats = getMemoryStats();
    expect(stats.factsCount).toBe(1);

    const match = findLearnedAnswer("when is the guest lecture on explainable AI?");
    expect(match).not.toBeNull();
    expect(match.text).toContain("guest lecture on explainable AI next week");
  });

  it("enforces learned facts limits", () => {
    for (let i = 0; i < MEMORY_LIMITS.MAX_FACTS + 10; i++) {
      teachFact(`Fact number ${i} about AI systems.`);
    }
    const stats = getMemoryStats();
    expect(stats.factsCount).toBe(MEMORY_LIMITS.MAX_FACTS);
  });

  it("allows altering answers and overrides default responses", () => {
    alterAnswer("what is your secret code?", "The secret code is 42-KYLE-OK.", { type: "scroll", target: "#lab" });
    const match = findLearnedAnswer("what is your secret code?");
    expect(match.text).toBe("The secret code is 42-KYLE-OK.");
    expect(match.action).toEqual({ type: "scroll", target: "#lab" });
  });

  it("responds to profile reflection queries", () => {
    recordInteraction("you", "I am Priya and my email is priya@acme.org.");
    const res = findLearnedAnswer("what do you know about me?");
    expect(res.text).toContain("Priya");
    expect(res.text).toContain("priya@acme.org");
  });

  it("can pause and clear memory", () => {
    teachFact("Something temporary.");
    clearMemory();
    expect(getMemoryStats().factsCount).toBe(0);

    toggleLearning(false);
    recordInteraction("you", "Remember that I like apples.");
    expect(getMemoryStats().factsCount).toBe(0);
  });
});
