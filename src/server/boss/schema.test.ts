import { describe, it, expect } from "vitest";
import { parseTurnJson } from "./schema";

const validJson = {
  customerReply: "I want my refund now!",
  mood: 30,
  moodDelta: -10,
  scores: { empathy: 7, ownership: 6, clarity: 8, solution: 5, tone: 9 },
  feedback: "Good empathy shown.",
  outcome: "continue",
};

describe("parseTurnJson", () => {
  it("parses a valid JSON string", () => {
    const raw = JSON.stringify(validJson);
    const result = parseTurnJson(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.customerReply).toBe("I want my refund now!");
      expect(result.data.mood).toBe(30);
      expect(result.data.scores.empathy).toBe(7);
    }
  });

  it("parses JSON inside ```json fences", () => {
    const raw = "```json\n" + JSON.stringify(validJson) + "\n```";
    const result = parseTurnJson(raw);
    expect(result.ok).toBe(true);
  });

  it("parses JSON inside ``` fences (no language tag)", () => {
    const raw = "```\n" + JSON.stringify(validJson) + "\n```";
    const result = parseTurnJson(raw);
    expect(result.ok).toBe(true);
  });

  it("clamps out-of-range mood to 0-100", () => {
    const raw = JSON.stringify({ ...validJson, mood: 150, moodDelta: 50 });
    const result = parseTurnJson(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mood).toBe(100);
      expect(result.data.moodDelta).toBe(40);
    }
  });

  it("clamps out-of-range scores to 0-10", () => {
    const raw = JSON.stringify({
      ...validJson,
      scores: { empathy: 15, ownership: -3, clarity: 8, solution: 5, tone: 9 },
    });
    const result = parseTurnJson(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.scores.empathy).toBe(10);
      expect(result.data.scores.ownership).toBe(0);
    }
  });

  it("extracts JSON from surrounding prose text", () => {
    const raw = "Here is my response: " + JSON.stringify(validJson) + " Thanks!";
    const result = parseTurnJson(raw);
    expect(result.ok).toBe(true);
  });

  it("fails on garbage input", () => {
    const result = parseTurnJson("not json at all blah blah");
    expect(result.ok).toBe(false);
  });

  it("fails on missing required fields", () => {
    const result = parseTurnJson(JSON.stringify({ customerReply: "hi" }));
    expect(result.ok).toBe(false);
  });

  it("fails on wrong outcome value", () => {
    const raw = JSON.stringify({ ...validJson, outcome: "maybe" });
    const result = parseTurnJson(raw);
    expect(result.ok).toBe(false);
  });
});
