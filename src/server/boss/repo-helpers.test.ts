/** Pure helper tests: opening line parsing and stars/xp math. */
import { describe, it, expect } from "vitest";
import { replayXp } from "@/lib/gamification";
import type { Stars } from "@/lib/gamification";

// ----- Opening line parser (extracted for testing) -----

function parseOpening(systemPrompt: string, problem: string): string {
  const lines = systemPrompt.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]?.trim() ?? "";
    if (line.startsWith("OPENING:")) {
      return line.slice("OPENING:".length).trim();
    }
  }
  return problem;
}

describe("parseOpening", () => {
  it("extracts OPENING line from end of systemPrompt", () => {
    const prompt = "You are a customer.\nOPENING: Hello, I need help.";
    expect(parseOpening(prompt, "fallback")).toBe("Hello, I need help.");
  });

  it("falls back to problem when no OPENING line", () => {
    const prompt = "You are a customer. Be rude.";
    expect(parseOpening(prompt, "My blender is broken.")).toBe("My blender is broken.");
  });

  it("handles OPENING in middle of prompt (uses last occurrence)", () => {
    const prompt = "Line 1\nOPENING: First one\nLine 3\nOPENING: Second one";
    expect(parseOpening(prompt, "fallback")).toBe("Second one");
  });
});

// ----- Stars / XP math -----

describe("replayXp", () => {
  it("gives full XP on first win (prev 0 stars)", () => {
    // 3 stars, base 150, prev 0 stars: full XP = 150 * 1.0 - 0 = 150
    const xp = replayXp(0 as Stars, 3 as Stars, 150);
    expect(xp).toBe(150);
  });

  it("gives improvement XP on replay with higher stars", () => {
    // prev 1 star (50%), now 2 stars (75%): improvement = 150*0.75 - 150*0.5 = 112.5-75 = 37.5 -> 37 or 38
    const xp = replayXp(1 as Stars, 2 as Stars, 150);
    expect(xp).toBeGreaterThan(0);
    expect(xp).toBeLessThan(150);
  });

  it("gives 0 XP when stars are not improved", () => {
    // prev 3 stars, now 2 stars: no improvement
    const xp = replayXp(3 as Stars, 2 as Stars, 150);
    expect(xp).toBe(0);
  });

  it("gives 0 XP on same star count", () => {
    const xp = replayXp(2 as Stars, 2 as Stars, 150);
    expect(xp).toBe(0);
  });
});

describe("stars calculation", () => {
  function calcStars(overall: number, won: boolean): Stars {
    return won ? (overall >= 8 ? 3 : overall >= 6.5 ? 2 : 1) : 0;
  }

  it("gives 3 stars for avg >= 8 when won", () => {
    expect(calcStars(8, true)).toBe(3);
    expect(calcStars(10, true)).toBe(3);
  });

  it("gives 2 stars for avg >= 6.5 when won", () => {
    expect(calcStars(6.5, true)).toBe(2);
    expect(calcStars(7.9, true)).toBe(2);
  });

  it("gives 1 star for avg < 6.5 when won", () => {
    expect(calcStars(5, true)).toBe(1);
    expect(calcStars(6.4, true)).toBe(1);
  });

  it("gives 0 stars when lost", () => {
    expect(calcStars(9, false)).toBe(0);
    expect(calcStars(0, false)).toBe(0);
  });
});
