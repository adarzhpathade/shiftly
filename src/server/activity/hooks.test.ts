import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/server/activity/repository", () => ({
  recordActivity: vi.fn().mockResolvedValue({ recorded: true, stageUps: [], xpEarned: 0 }),
  realActivityRepo: {
    record: vi.fn().mockResolvedValue({ recorded: true, stageUps: [], xpEarned: 0 }),
  },
}));

vi.mock("@/server/db", () => ({
  db: {
    attempt: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    scenario: {
      findFirst: vi.fn(),
    },
    roleplaySession: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    dailyQuest: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    xpEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) =>
      cb({
        attempt: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        roleplaySession: {
          update: vi.fn().mockResolvedValue({}),
        },
        dailyQuest: {
          update: vi.fn().mockResolvedValue({}),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ xp: 100, level: 1 }),
          update: vi.fn().mockResolvedValue({}),
        },
        xpEvent: {
          create: vi.fn().mockResolvedValue({}),
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

import { db } from "@/server/db";
import { recordActivity, realActivityRepo } from "@/server/activity/repository";
import { realTrainingRepo } from "@/server/training/repository";
import { realBossRepo } from "@/server/boss/repo";
import { recordDailyOpen } from "@/server/activity/daily-open";
import { progressQuests } from "@/server/progress/award";
import * as questsModule from "@/server/progress/quests";

describe("activity hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("training finishAttempt hook", () => {
    it("records training_finished and perfect_score when stars = 3", async () => {
      const mockAttempt = {
        id: "att-1",
        userId: "u-1",
        scenarioId: "sc-1",
        answers: [
          {
            stepId: "step-1",
            step: { customerMessage: "Hello" },
            choice: { text: "Hi", rating: "BEST", points: 25, feedback: "Great", nextStepId: null },
          },
        ],
        scenario: {
          id: "sc-1",
          categoryId: "cat-1",
          level: 1,
          xpReward: 100,
          category: { slug: "handling-complaints" },
          steps: [{ id: "step-1", choices: [{ points: 25 }] }],
        },
      };

      vi.mocked(db.attempt.findUnique).mockResolvedValue(mockAttempt as never);
      vi.mocked(db.attempt.findFirst).mockResolvedValue(null);
      vi.mocked(db.scenario.findFirst).mockResolvedValue(null);

      await realTrainingRepo.finishAttempt("u-1", "att-1");

      expect(recordActivity).toHaveBeenCalledWith(
        expect.anything(),
        "u-1",
        expect.objectContaining({
          type: "training_finished",
          categoryKey: "handling-complaints",
          stars: 3,
          categoryId: "cat-1",
        }),
      );

      expect(recordActivity).toHaveBeenCalledWith(
        expect.anything(),
        "u-1",
        expect.objectContaining({
          type: "perfect_score",
          categoryKey: "handling-complaints",
          categoryId: "cat-1",
        }),
      );
    });

    it("records only training_finished when stars < 3", async () => {
      const mockAttempt = {
        id: "att-2",
        userId: "u-1",
        scenarioId: "sc-1",
        answers: [
          {
            stepId: "step-1",
            step: { customerMessage: "Hello" },
            choice: { text: "Okay", rating: "OKAY", points: 15, feedback: "Okay", nextStepId: null },
          },
        ],
        scenario: {
          id: "sc-1",
          categoryId: "cat-1",
          level: 1,
          xpReward: 100,
          category: { slug: "handling-complaints" },
          steps: [{ id: "step-1", choices: [{ points: 25 }] }],
        },
      };

      vi.mocked(db.attempt.findUnique).mockResolvedValue(mockAttempt as never);
      vi.mocked(db.attempt.findFirst).mockResolvedValue(null);
      vi.mocked(db.scenario.findFirst).mockResolvedValue(null);

      await realTrainingRepo.finishAttempt("u-1", "att-2");

      expect(recordActivity).toHaveBeenCalledWith(
        expect.anything(),
        "u-1",
        expect.objectContaining({
          type: "training_finished",
          categoryKey: "handling-complaints",
        }),
      );

      expect(recordActivity).not.toHaveBeenCalledWith(
        expect.anything(),
        "u-1",
        expect.objectContaining({
          type: "perfect_score",
        }),
      );
    });
  });

  describe("boss finishSession hook", () => {
    it("records boss_finished with won in meta", async () => {
      const mockSession = {
        id: "sess-1",
        userId: "u-1",
        personaId: "persona-1",
        status: "WON",
        mood: 90,
        xpEarned: null,
        endedAt: null,
        turns: [
          { empathy: 9, ownership: 9, clarity: 9, solution: 9, tone: 9, userMessage: "Hello" },
        ],
        persona: {
          id: "persona-1",
          categoryId: "cat-1",
          xpReward: 100,
          category: { slug: "difficult-customers" },
        },
      };

      vi.mocked(db.roleplaySession.findUnique).mockResolvedValue(mockSession as never);
      vi.mocked(db.roleplaySession.findFirst).mockResolvedValue(null);

      await realBossRepo.finishSession("u-1", "sess-1");

      expect(recordActivity).toHaveBeenCalledWith(
        expect.anything(),
        "u-1",
        expect.objectContaining({
          type: "boss_finished",
          categoryKey: "difficult-customers",
          won: true,
          categoryId: "cat-1",
        }),
      );
    });
  });

  describe("quest_completed in progressQuests hook", () => {
    it("records quest_completed when quest finishes", async () => {
      const mockQuests = [
        { id: "quest-1", type: "scenario" as const, label: "Scenario", target: 1, progress: 0, completed: false, xpReward: 30 },
      ];

      vi.spyOn(questsModule, "ensureTodayQuests").mockResolvedValue(mockQuests);

      const tx = {
        dailyQuest: {
          update: vi.fn().mockResolvedValue({}),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ xp: 100, level: 1 }),
          update: vi.fn().mockResolvedValue({}),
        },
        xpEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      };

      await progressQuests(tx as never, "u-1", "scenario", 1);

      expect(recordActivity).toHaveBeenCalledWith(
        tx,
        "u-1",
        expect.objectContaining({
          type: "quest_completed",
          questId: "quest-1",
        }),
      );
    });
  });

  describe("recordDailyOpen", () => {
    it("calls realActivityRepo.record with daily_open event", async () => {
      await recordDailyOpen("u-1");

      expect(realActivityRepo.record).toHaveBeenCalledWith("u-1", {
        type: "daily_open",
      });
    });
  });
});
