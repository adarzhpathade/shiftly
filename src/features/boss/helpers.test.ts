import { describe, expect, it } from "vitest";
import { averageScore, chipTone, parseNdjson, reactionFor, turnTip } from "./helpers";

const scores = { empathy: 8, ownership: 6, clarity: 2, solution: 7, tone: 7 };

describe("boss helpers", () => {
  it("averages scores", () => {
    expect(averageScore(scores)).toBeCloseTo(6);
  });
  it("prefers model feedback, else hints at the weakest skill", () => {
    expect(turnTip(scores, " Nice ")).toBe("Nice");
    expect(turnTip(scores)).toMatch(/short and specific/);
  });
  it("tones chips", () => {
    expect(chipTone(8)).toBe("great");
    expect(chipTone(5)).toBe("ok");
    expect(chipTone(2)).toBe("weak");
  });
  it("reacts only to big mood jumps", () => {
    expect(reactionFor(3)).toBeNull();
    expect(reactionFor(9)).toBe("😊");
    expect(reactionFor(-20)).toBe("😡");
  });
  it("parses ndjson across chunk boundaries", () => {
    const a = parseNdjson('{"type":"token","text":"Hi"}\n{"type":"tok');
    expect(a.events).toHaveLength(1);
    const b = parseNdjson(`${a.rest}en","text":"!"}\n`);
    expect(b.events[0]).toEqual({ type: "token", text: "!" });
  });
});
