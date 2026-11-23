// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateAiLines, generateCoachNote } from "./ai";
import type { CoachSummary } from "./summary";

// Mock boss providers and guard
const mockCallGroq = vi.fn();
const mockCallOpenRouterCustomer = vi.fn();
const mockConsumeBudget = vi.fn();
const mockAssertAllowed = vi.fn();

vi.mock("@/server/boss/providers", () => ({
  callGroq: (...args: unknown[]) => mockCallGroq(...args),
  callOpenRouterCustomer: (...args: unknown[]) => mockCallOpenRouterCustomer(...args),
}));

vi.mock("@/server/boss/guard", () => ({
  consumeBudget: (...args: unknown[]) => mockConsumeBudget(...args),
  assertAllowed: (...args: unknown[]) => mockAssertAllowed(...args),
}));

describe("validateAiLines", () => {
  it("validates correct JSON object with 3 valid lines", () => {
    const input = JSON.stringify({
      lines: [
        "Great job completing scenarios this week.",
        "Your score in Customer Queries was impressive.",
        "Try Difficult Customers next for even better results.",
      ],
    });

    const result = validateAiLines(input);
    expect(result).toEqual([
      "Great job completing scenarios this week.",
      "Your score in Customer Queries was impressive.",
      "Try Difficult Customers next for even better results.",
    ]);
  });

  it("validates plain text with 3 numbered lines", () => {
    const input = `1. Great job completing scenarios this week.
2. Your score in Customer Queries was impressive.
3. Try Difficult Customers next for even better results.`;

    const result = validateAiLines(input);
    expect(result).toEqual([
      "Great job completing scenarios this week.",
      "Your score in Customer Queries was impressive.",
      "Try Difficult Customers next for even better results.",
    ]);
  });

  it("rejects lines exceeding 90 characters", () => {
    const longLine = "A".repeat(91);
    const input = JSON.stringify({
      lines: ["Short line 1", longLine, "Short line 3"],
    });

    const result = validateAiLines(input);
    expect(result).toBeNull();
  });

  it("rejects output containing emojis", () => {
    const input = JSON.stringify({
      lines: ["Great job! 🎯", "High scores across scenarios.", "Keep it up next week."],
    });

    const result = validateAiLines(input);
    expect(result).toBeNull();
  });

  it("rejects output with fewer or more than 3 lines", () => {
    expect(validateAiLines(JSON.stringify({ lines: ["One line"] }))).toBeNull();
    expect(
      validateAiLines(
        JSON.stringify({
          lines: ["Line 1", "Line 2", "Line 3", "Line 4"],
        }),
      ),
    ).toBeNull();
  });
});

describe("generateCoachNote", () => {
  const dummySummary: CoachSummary = {
    daysActive: 3,
    scenariosFinishedPerCategory: { "handling-complaints": 2 },
    totalScenariosFinished: 2,
    averageStars: 2.5,
    bossCallsWon: 1,
    bossCallsLost: 0,
    perfectScores: 1,
    questsCompleted: 2,
    mostActiveDayPart: "morning",
    changeVsLastWeek: { daysActive: 1, scenariosFinished: 1 },
    weakestCategory: "handling-complaints",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsumeBudget.mockReturnValue(true);
    delete process.env.AI_MODE;
    process.env.GROQ_API_KEY = "test-groq-key";
  });

  it("returns rules note when AI_MODE=mock", async () => {
    process.env.AI_MODE = "mock";

    const res = await generateCoachNote(dummySummary);
    expect(res.source).toBe("rules");
    expect(mockCallGroq).not.toHaveBeenCalled();
  });

  it("uses Groq and returns ai note when Groq succeeds with valid lines", async () => {
    process.env.AI_MODE = "real";
    mockCallGroq.mockResolvedValue({
      ok: true,
      content: JSON.stringify({
        lines: [
          "Consistent practice across 3 days this week.",
          "Great win on your boss customer session.",
          "Try Handling Complaints again to reach 3 stars.",
        ],
      }),
    });

    const res = await generateCoachNote(dummySummary);
    expect(res.source).toBe("ai");
    expect(res.lines).toEqual([
      "Consistent practice across 3 days this week.",
      "Great win on your boss customer session.",
      "Try Handling Complaints again to reach 3 stars.",
    ]);
  });

  it("falls back to OpenRouter when Groq fails", async () => {
    process.env.AI_MODE = "real";
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";

    // Groq fails
    mockCallGroq.mockResolvedValue({
      ok: false,
      error: "Groq error",
    });

    // OpenRouter succeeds
    mockCallOpenRouterCustomer.mockResolvedValue({
      ok: true,
      content: JSON.stringify({
        lines: [
          "Nice job training on multiple days.",
          "Solid scores on customer handling.",
          "Review your feedback and keep going.",
        ],
      }),
    });

    const res = await generateCoachNote(dummySummary);
    expect(res.source).toBe("ai");
    expect(mockCallOpenRouterCustomer).toHaveBeenCalled();
  });

  it("falls back to rules when both providers fail", async () => {
    process.env.AI_MODE = "real";
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";

    mockCallGroq.mockResolvedValue({ ok: false, error: "Groq error" });
    mockCallOpenRouterCustomer.mockResolvedValue({ ok: false, error: "OR error" });

    const res = await generateCoachNote(dummySummary);
    expect(res.source).toBe("rules");
    expect(res.lines).toHaveLength(3);
  });
});
