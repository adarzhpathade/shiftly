import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", () => ({
  db: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    scenario: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    attempt: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    attemptAnswer: {
      create: vi.fn(),
    },
    roleplaySession: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn) =>
      fn({
        attempt: {
          update: vi.fn().mockResolvedValue({}),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: "u-1" }),
        },
        category: {
          findUnique: vi.fn().mockResolvedValue({ id: "cat-1" }),
        },
        activityEvent: {
          create: vi.fn().mockResolvedValue({ id: "ae-1" }),
        },
      }),
    ),
  },
}));
vi.mock("@/server/progress", () => ({
  awardXp: vi.fn().mockResolvedValue({ xp: 100, level: 1 }),
  checkBadges: vi.fn().mockResolvedValue([]),
  progressQuests: vi.fn().mockResolvedValue([]),
  touchStreak: vi.fn().mockResolvedValue({ currentStreak: 1, bestStreak: 1, status: "first" }),
}));

import { realTrainingRepo } from "./repository";
import { db } from "@/server/db";

describe("realTrainingRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGuidedScenario", () => {
    it("returns steps and choices without exposing ratings or feedback", async () => {
      const mockScenario = {
        id: "sc-hc-1",
        title: "Late Delivery",
        situation: "The package is delayed.",
        difficulty: "BEGINNER",
        xpReward: 100,
        category: { slug: "handling-complaints" },
        steps: [
          {
            id: "step-1",
            order: 1,
            customerMessage: "Where is my order?",
            choices: [
              { id: "c1", text: "I apologize, let me check.", rating: "BEST", points: 25, feedback: "Great apology." },
              { id: "c2", text: "Track it online.", rating: "POOR", points: 5, feedback: "Unhelpful." },
            ],
          },
        ],
      };

      vi.mocked(db.scenario.findUnique).mockResolvedValue(mockScenario as never);

      const scenario = await realTrainingRepo.getGuidedScenario("sc-hc-1");

      expect(scenario.id).toBe("sc-hc-1");
      expect(scenario.title).toBe("Late Delivery");
      expect(scenario.steps).toHaveLength(1);
      const step = scenario.steps[0]!;
      expect(step.choices).toHaveLength(2);

      // Verify no leak of rating, points or feedback
      expect(step.choices[0]).toEqual({ id: "c1", text: "I apologize, let me check." });
      expect("rating" in (step.choices[0] ?? {})).toBe(false);
      expect("points" in (step.choices[0] ?? {})).toBe(false);
      expect("feedback" in (step.choices[0] ?? {})).toBe(false);
    });
  });

  describe("startAttempt", () => {
    it("creates an attempt with finishedAt: null", async () => {
      const mockScenario = {
        id: "sc-hc-1",
        steps: [{ id: "step-1", order: 1 }],
      };

      vi.mocked(db.scenario.findUnique).mockResolvedValue(mockScenario as never);
      vi.mocked(db.attempt.create).mockResolvedValue({ id: "att-1" } as never);

      const result = await realTrainingRepo.startAttempt("u-1", "sc-hc-1");

      expect(result).toEqual({
        attemptId: "att-1",
        scenarioId: "sc-hc-1",
        firstStepId: "step-1",
      });
      expect(db.attempt.create).toHaveBeenCalledWith({
        data: {
          userId: "u-1",
          scenarioId: "sc-hc-1",
          score: 0,
          stars: 0,
          xpEarned: 0,
          finishedAt: null,
        },
      });
    });
  });

  describe("answerStep", () => {
    it("records choice and returns answer feedback with nextStepId", async () => {
      const mockAttempt = {
        id: "att-1",
        userId: "u-1",
        finishedAt: null,
        answers: [],
        scenario: {
          steps: [
            {
              id: "step-1",
              order: 1,
              choices: [
                { id: "c1", rating: "BEST", points: 25, feedback: "Good empathy", nextStepId: "step-2" },
                { id: "c2", rating: "POOR", points: 5, feedback: "Not good", nextStepId: "step-2" },
              ],
            },
          ],
        },
      };

      vi.mocked(db.attempt.findUnique).mockResolvedValue(mockAttempt as never);
      vi.mocked(db.attemptAnswer.create).mockResolvedValue({} as never);

      const answerResult = await realTrainingRepo.answerStep("u-1", "att-1", "step-1", "c1");

      expect(answerResult).toEqual({
        rating: "best",
        points: 25,
        maxPoints: 25,
        feedback: "Good empathy",
        nextStepId: "step-2",
      });
      expect(db.attemptAnswer.create).toHaveBeenCalledWith({
        data: {
          attemptId: "att-1",
          stepId: "step-1",
          choiceId: "c1",
        },
      });
    });

    it("rejects answering a step twice", async () => {
      const mockAttempt = {
        id: "att-1",
        userId: "u-1",
        finishedAt: null,
        answers: [{ stepId: "step-1", choiceId: "c1" }],
        scenario: {
          steps: [{ id: "step-1", choices: [] }],
        },
      };

      vi.mocked(db.attempt.findUnique).mockResolvedValue(mockAttempt as never);

      await expect(
        realTrainingRepo.answerStep("u-1", "att-1", "step-1", "c1"),
      ).rejects.toThrow("Step already answered");
    });
  });

  describe("finishAttempt", () => {
    it("completes attempt, calculates score and stars, awards XP and progress", async () => {
      const mockAttempt = {
        id: "att-1",
        userId: "u-1",
        scenarioId: "sc-hc-1",
        answers: [
          {
            stepId: "step-1",
            step: { customerMessage: "Msg 1" },
            choice: { text: "Reply 1", rating: "BEST", points: 25, feedback: "Nice", nextStepId: null },
          },
        ],
        scenario: {
          id: "sc-hc-1",
          categoryId: "cat-hc",
          level: 1,
          xpReward: 100,
          category: { slug: "handling-complaints" },
          steps: [
            {
              id: "step-1",
              choices: [{ points: 25 }],
            },
          ],
        },
      };

      vi.mocked(db.attempt.findUnique).mockResolvedValue(mockAttempt as never);
      vi.mocked(db.attempt.findFirst).mockResolvedValue(null); // No previous best
      vi.mocked(db.scenario.findFirst).mockResolvedValue({ id: "sc-hc-2" } as never);

      const result = await realTrainingRepo.finishAttempt("u-1", "att-1");

      expect(result.attemptId).toBe("att-1");
      expect(result.stars).toBe(3);
      expect(result.score).toBe(25);
      expect(result.maxScore).toBe(25);
      expect(result.xpEarned).toBe(100);
      expect(result.nextScenarioId).toBe("sc-hc-2");
    });

    it("refuses to finish an attempt twice, so XP is never paid twice", async () => {
      vi.mocked(db.attempt.findUnique).mockResolvedValue({
        id: "att-1",
        userId: "u-1",
        scenarioId: "sc-hc-1",
        finishedAt: new Date(),
        answers: [],
        scenario: { steps: [] },
      } as never);

      await expect(realTrainingRepo.finishAttempt("u-1", "att-1")).rejects.toThrow("already finished");
    });
  });
});
