import { describe, expect, it } from "vitest";
import type { CategoryKey } from "../../../src/lib/types";
import { BOSS_PERSONAS, GUIDED_SCENARIOS } from "./content";

const EXPECTED_CATEGORIES: readonly CategoryKey[] = [
  "handling-complaints",
  "customer-queries",
  "difficult-customers",
  "problem-solving",
];

describe("Scenario content rules", () => {
  it("contains exactly 16 guided scenarios", () => {
    expect(GUIDED_SCENARIOS).toHaveLength(16);
  });

  it("has exactly 4 scenarios per category, with levels 1 to 4 each present", () => {
    for (const cat of EXPECTED_CATEGORIES) {
      const inCat = GUIDED_SCENARIOS.filter((s) => s.categoryKey === cat);
      expect(inCat).toHaveLength(4);

      const levels = inCat.map((s) => s.level).sort();
      expect(levels).toEqual([1, 2, 3, 4]);
    }
  });

  it("configures beginner scenarios (levels 1 and 2) with 1 step and exactly 3 choices", () => {
    const beginners = GUIDED_SCENARIOS.filter((s) => s.level === 1 || s.level === 2);
    expect(beginners).toHaveLength(8);

    for (const s of beginners) {
      expect(s.difficulty).toBe("beginner");
      expect(s.xpReward).toBe(40);
      expect(s.steps).toHaveLength(1);
      expect(s.steps[0]?.choices).toHaveLength(3);
    }
  });

  it("configures intermediate scenarios (levels 3 and 4) with 2 steps and 3 or 4 choices per step", () => {
    const intermediates = GUIDED_SCENARIOS.filter((s) => s.level === 3 || s.level === 4);
    expect(intermediates).toHaveLength(8);

    for (const s of intermediates) {
      expect(s.difficulty).toBe("intermediate");
      expect(s.xpReward).toBe(60);
      expect(s.steps).toHaveLength(2);
      for (const step of s.steps) {
        expect(step.choices.length).toBeGreaterThanOrEqual(3);
        expect(step.choices.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it("ensures every step has exactly one 'best' choice, at least one 'okay', and at least one 'poor'", () => {
    for (const s of GUIDED_SCENARIOS) {
      for (const step of s.steps) {
        const bestChoices = step.choices.filter((c) => c.rating === "best");
        const okayChoices = step.choices.filter((c) => c.rating === "okay");
        const poorChoices = step.choices.filter((c) => c.rating === "poor");

        expect(bestChoices).toHaveLength(1);
        expect(bestChoices[0]?.points).toBe(10);

        expect(okayChoices.length).toBeGreaterThanOrEqual(1);
        for (const c of okayChoices) {
          expect(c.points).toBe(5);
        }

        expect(poorChoices.length).toBeGreaterThanOrEqual(1);
        for (const c of poorChoices) {
          expect(c.points).toBe(0);
        }
      }
    }
  });

  it("ensures every choice has non-empty feedback starting with the rating word", () => {
    for (const s of GUIDED_SCENARIOS) {
      for (const step of s.steps) {
        for (const choice of step.choices) {
          expect(choice.feedback.trim().length).toBeGreaterThan(10);

          if (choice.rating === "best") {
            expect(choice.feedback.startsWith("Best.")).toBe(true);
          } else if (choice.rating === "okay") {
            expect(choice.feedback.startsWith("Okay.")).toBe(true);
          } else if (choice.rating === "poor") {
            expect(choice.feedback.startsWith("Poor.")).toBe(true);
          }
        }
      }
    }
  });

  it("verifies nextStepId pointers: intermediate step 1 points to step 2; all terminal choices are null", () => {
    for (const s of GUIDED_SCENARIOS) {
      const stepIds = new Set(s.steps.map((st) => st.id));

      if (s.difficulty === "beginner") {
        for (const choice of s.steps[0]!.choices) {
          expect(choice.nextStepId).toBeNull();
        }
      } else {
        const step1 = s.steps[0]!;
        const step2 = s.steps[1]!;

        for (const choice of step1.choices) {
          expect(choice.nextStepId).toBe(step2.id);
          expect(stepIds.has(choice.nextStepId!)).toBe(true);
        }

        for (const choice of step2.choices) {
          expect(choice.nextStepId).toBeNull();
        }
      }
    }
  });

  it("has deterministic unique IDs across all scenarios, steps, and choices", () => {
    const scenarioIds = new Set<string>();
    const stepIds = new Set<string>();
    const choiceIds = new Set<string>();

    for (const s of GUIDED_SCENARIOS) {
      expect(scenarioIds.has(s.id)).toBe(false);
      scenarioIds.add(s.id);

      for (const step of s.steps) {
        expect(stepIds.has(step.id)).toBe(false);
        stepIds.add(step.id);

        for (const choice of step.choices) {
          expect(choiceIds.has(choice.id)).toBe(false);
          choiceIds.add(choice.id);
        }
      }
    }

    expect(scenarioIds.size).toBe(16);
    expect(stepIds.size).toBe(24); // 8 * 1 + 8 * 2 = 24
  });
});

describe("Boss personas content rules", () => {
  it("contains exactly 4 boss personas, one per category", () => {
    expect(BOSS_PERSONAS).toHaveLength(4);
    const catKeys = BOSS_PERSONAS.map((p) => p.categoryKey);
    expect(catKeys.sort()).toEqual([...EXPECTED_CATEGORIES].sort());
  });

  it("has valid persona fields: non-empty systemPrompt, hiddenGoal, startMood 0-100, xpReward 150", () => {
    for (const p of BOSS_PERSONAS) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.problem.length).toBeGreaterThan(0);
      expect(p.avatarKey.length).toBeGreaterThan(0);
      expect(p.startMood).toBeGreaterThanOrEqual(0);
      expect(p.startMood).toBeLessThanOrEqual(100);
      expect(p.xpReward).toBe(150);

      expect(p.hiddenGoal.trim().length).toBeGreaterThan(15);
      expect(p.systemPrompt.trim().length).toBeGreaterThan(50);
      expect(p.systemPrompt.startsWith("You are")).toBe(true);

      expect(p.opening.trim().length).toBeGreaterThan(10);
      expect(p.replies.low).toHaveLength(2);
      expect(p.replies.mid).toHaveLength(2);
      expect(p.replies.high).toHaveLength(2);
      expect(p.won.trim().length).toBeGreaterThan(10);
      expect(p.lost.trim().length).toBeGreaterThan(10);
      expect(p.quickReplies).toHaveLength(3);
      expect(p.betterReply.trim().length).toBeGreaterThan(10);
    }
  });
});
