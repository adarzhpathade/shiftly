// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateRulesNote, EMPTY_WEEK_LINES } from "./rules";
import type { CoachSummary } from "./summary";

describe("generateRulesNote", () => {
  const EMOJI_REGEX =
    /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  it("returns exact empty-week line set when user has no activity", () => {
    const emptySummary: CoachSummary = {
      daysActive: 0,
      scenariosFinishedPerCategory: {},
      totalScenariosFinished: 0,
      averageStars: null,
      bossCallsWon: 0,
      bossCallsLost: 0,
      perfectScores: 0,
      questsCompleted: 0,
      mostActiveDayPart: null,
      changeVsLastWeek: { daysActive: 0, scenariosFinished: 0 },
      weakestCategory: null,
    };

    const lines = generateRulesNote(emptySummary);

    expect(lines).toEqual(EMPTY_WEEK_LINES);
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line.length).toBeGreaterThan(0);
      expect(line.length).toBeLessThanOrEqual(90);
      expect(EMOJI_REGEX.test(line)).toBe(false);
    }
  });

  it("produces exactly 3 short friendly lines for an active user", () => {
    const activeSummary: CoachSummary = {
      daysActive: 4,
      scenariosFinishedPerCategory: {
        "handling-complaints": 3,
        "difficult-customers": 1,
      },
      totalScenariosFinished: 4,
      averageStars: 2.8,
      bossCallsWon: 1,
      bossCallsLost: 0,
      perfectScores: 2,
      questsCompleted: 3,
      mostActiveDayPart: "morning",
      changeVsLastWeek: { daysActive: 1, scenariosFinished: 2 },
      weakestCategory: "difficult-customers",
    };

    const lines = generateRulesNote(activeSummary);

    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line.length).toBeGreaterThan(0);
      expect(line.length).toBeLessThanOrEqual(90);
      expect(EMOJI_REGEX.test(line)).toBe(false);
    }

    // Check that weakest category advice is included
    expect(lines[2]).toContain("Difficult Customers");
  });

  it("handles different activity profiles while staying under 90 characters without emojis", () => {
    const profiles: CoachSummary[] = [
      {
        daysActive: 1,
        scenariosFinishedPerCategory: { "problem-solving": 1 },
        totalScenariosFinished: 1,
        averageStars: 1.0,
        bossCallsWon: 0,
        bossCallsLost: 1,
        perfectScores: 0,
        questsCompleted: 0,
        mostActiveDayPart: "evening",
        changeVsLastWeek: { daysActive: -2, scenariosFinished: -3 },
        weakestCategory: "problem-solving",
      },
      {
        daysActive: 6,
        scenariosFinishedPerCategory: {
          "customer-queries": 5,
          "handling-complaints": 4,
        },
        totalScenariosFinished: 9,
        averageStars: 3.0,
        bossCallsWon: 2,
        bossCallsLost: 0,
        perfectScores: 6,
        questsCompleted: 5,
        mostActiveDayPart: "morning",
        changeVsLastWeek: { daysActive: 2, scenariosFinished: 4 },
        weakestCategory: null,
      },
    ];

    for (const profile of profiles) {
      const lines = generateRulesNote(profile);
      expect(lines).toHaveLength(3);
      for (const line of lines) {
        expect(line.length).toBeGreaterThan(0);
        expect(line.length).toBeLessThanOrEqual(90);
        expect(EMOJI_REGEX.test(line)).toBe(false);
      }
    }
  });
});
