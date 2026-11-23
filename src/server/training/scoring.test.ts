import { describe, expect, it } from "vitest";
import {
  computeStepMaxPoints,
  computeAttemptScores,
  computeStars,
  computeXpAward,
  isLevelLocked,
  findNextScenarioId,
} from "./scoring";

describe("scoring logic", () => {
  describe("computeStepMaxPoints", () => {
    it("returns max points among choices", () => {
      expect(computeStepMaxPoints([{ points: 10 }, { points: 25 }, { points: 0 }])).toBe(25);
    });

    it("returns 0 for empty choices", () => {
      expect(computeStepMaxPoints([])).toBe(0);
    });
  });

  describe("computeAttemptScores", () => {
    it("aggregates scores and max possible points for all answered steps", () => {
      const steps = [
        {
          id: "s1",
          choices: [
            { id: "c1", points: 10 },
            { id: "c2", points: 25 },
          ],
        },
        {
          id: "s2",
          choices: [
            { id: "c3", points: 20 },
            { id: "c4", points: 0 },
          ],
        },
      ];

      const answers = [
        { stepId: "s1", choiceId: "c2" }, // 25 / 25
        { stepId: "s2", choiceId: "c3" }, // 20 / 20
      ];

      const res = computeAttemptScores(steps, answers);
      expect(res).toEqual({ score: 45, maxScore: 45 });
    });
  });

  describe("computeStars", () => {
    it("returns 3 stars for >= 90%", () => {
      expect(computeStars(90, 100)).toBe(3);
      expect(computeStars(100, 100)).toBe(3);
    });

    it("returns 2 stars for >= 60% and < 90%", () => {
      expect(computeStars(60, 100)).toBe(2);
      expect(computeStars(85, 100)).toBe(2);
    });

    it("returns 1 star for < 60% when finished", () => {
      expect(computeStars(30, 100)).toBe(1);
      expect(computeStars(0, 100)).toBe(1);
    });
  });

  describe("computeXpAward (best-score rule)", () => {
    it("pays full XP on first play with 3 stars", () => {
      expect(computeXpAward(0, 3, 100)).toBe(100);
    });

    it("pays partial XP on first play with 2 stars (75%)", () => {
      expect(computeXpAward(0, 2, 100)).toBe(75);
    });

    it("pays partial XP on first play with 1 star (50%)", () => {
      expect(computeXpAward(0, 1, 100)).toBe(50);
    });

    it("pays only the improvement difference when replaying", () => {
      // Replaying from 1 star (50) to 2 stars (75) -> 25 XP
      expect(computeXpAward(1, 2, 100)).toBe(25);
      // Replaying from 2 stars (75) to 3 stars (100) -> 25 XP
      expect(computeXpAward(2, 3, 100)).toBe(25);
    });

    it("pays 0 XP when score does not improve", () => {
      expect(computeXpAward(3, 3, 100)).toBe(0);
      expect(computeXpAward(2, 2, 100)).toBe(0);
      expect(computeXpAward(2, 1, 100)).toBe(0);
    });
  });

  describe("isLevelLocked", () => {
    it("level 1 is never locked", () => {
      expect(isLevelLocked(1, {})).toBe(false);
    });

    it("level 2 unlocks when level 1 has >= 1 star", () => {
      expect(isLevelLocked(2, { 1: 0 })).toBe(true);
      expect(isLevelLocked(2, { 1: 1 })).toBe(false);
      expect(isLevelLocked(2, { 1: 3 })).toBe(false);
    });

    it("level 5 (boss) requires all levels 1 to 4 to have >= 1 star", () => {
      expect(isLevelLocked(5, { 1: 1, 2: 1, 3: 1, 4: 0 })).toBe(true);
      expect(isLevelLocked(5, { 1: 1, 2: 2, 3: 1, 4: 1 })).toBe(false);
      expect(isLevelLocked(5, { 1: 3, 2: 3, 3: 3, 4: 3 })).toBe(false);
    });
  });

  describe("findNextScenarioId", () => {
    it("finds the next level scenario in the same category", () => {
      const scenarios = [
        { id: "sc-hc-1", categoryKey: "handling-complaints" as const, level: 1 },
        { id: "sc-hc-2", categoryKey: "handling-complaints" as const, level: 2 },
        { id: "sc-cq-1", categoryKey: "customer-queries" as const, level: 1 },
      ];

      expect(findNextScenarioId(scenarios, "handling-complaints", 1)).toBe("sc-hc-2");
      expect(findNextScenarioId(scenarios, "handling-complaints", 2)).toBeNull();
    });
  });
});
