import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  evaluateBadgeRule,
  calculateStreak,
  awardXp,
  progressQuests,
  checkBadges,
  touchStreak,
} from "./award";
import { XpSource, type Prisma } from "@/generated/prisma/client";
import * as questsModule from "./quests";

describe("award", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("evaluateBadgeRule (pure)", () => {
    const stats = {
      scenariosCompleted: 5,
      perfectScores: 2,
      streakDays: 7,
      categoryStars: 12,
      bossWins: 1,
    };

    it("evaluates scenarios_completed", () => {
      expect(evaluateBadgeRule("scenarios_completed", 5, stats)).toBe(true);
      expect(evaluateBadgeRule("scenarios_completed", 6, stats)).toBe(false);
    });

    it("evaluates perfect_scores", () => {
      expect(evaluateBadgeRule("perfect_scores", 2, stats)).toBe(true);
      expect(evaluateBadgeRule("perfect_scores", 3, stats)).toBe(false);
    });

    it("evaluates streak_days", () => {
      expect(evaluateBadgeRule("streak_days", 7, stats)).toBe(true);
      expect(evaluateBadgeRule("streak_days", 30, stats)).toBe(false);
    });

    it("evaluates category_stars", () => {
      expect(evaluateBadgeRule("category_stars", 12, stats)).toBe(true);
      expect(evaluateBadgeRule("category_stars", 15, stats)).toBe(false);
    });

    it("evaluates boss_wins", () => {
      expect(evaluateBadgeRule("boss_wins", 1, stats)).toBe(true);
      expect(evaluateBadgeRule("boss_wins", 2, stats)).toBe(false);
    });

    it("returns false for team_assignments (TODO stub)", () => {
      expect(evaluateBadgeRule("team_assignments", 5, stats)).toBe(false);
    });

    it("returns false for unknown rules", () => {
      expect(evaluateBadgeRule("unknown_rule", 1, stats)).toBe(false);
    });
  });

  describe("calculateStreak (pure)", () => {
    it("starts streak at 1 on first check-in", () => {
      const res = calculateStreak(null, "2026-11-23", 0, 0);
      expect(res).toEqual({ currentStreak: 1, bestStreak: 1, status: "first" });
    });

    it("keeps same streak when active on same day", () => {
      const res = calculateStreak("2026-11-23", "2026-11-23", 5, 10);
      expect(res).toEqual({ currentStreak: 5, bestStreak: 10, status: "same-day" });
    });

    it("increments streak when active the next day", () => {
      const res = calculateStreak("2026-11-22", "2026-11-23", 5, 10);
      expect(res).toEqual({ currentStreak: 6, bestStreak: 10, status: "continued" });
    });

    it("updates bestStreak when current exceeds it", () => {
      const res = calculateStreak("2026-11-22", "2026-11-23", 10, 10);
      expect(res).toEqual({ currentStreak: 11, bestStreak: 11, status: "continued" });
    });

    it("resets streak to 1 after missing a day", () => {
      const res = calculateStreak("2026-11-20", "2026-11-23", 8, 12);
      expect(res).toEqual({ currentStreak: 1, bestStreak: 12, status: "reset" });
    });
  });

  describe("awardXp", () => {
    it("does nothing when amount <= 0", async () => {
      const tx = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ xp: 100, level: 1 }),
          update: vi.fn(),
        },
        xpEvent: {
          create: vi.fn(),
        },
      } as unknown as Prisma.TransactionClient;

      const result = await awardXp(tx, "u-1", {
        source: XpSource.SCENARIO,
        amount: 0,
      });

      expect(result).toEqual({ xp: 100, level: 1 });
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.xpEvent.create).not.toHaveBeenCalled();
    });

    it("awards XP without level up when within level threshold", async () => {
      // Level 1: 0 to 249 XP. Level 2 starts at 250 XP.
      const tx = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ xp: 100, level: 1 }),
          update: vi.fn().mockResolvedValue({}),
        },
        xpEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
        activityEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      } as unknown as Prisma.TransactionClient;

      const result = await awardXp(tx, "u-1", {
        source: XpSource.SCENARIO,
        amount: 50,
        refId: "sc-1",
      });

      expect(result).toEqual({ xp: 150, level: 1 });
      expect(tx.xpEvent.create).toHaveBeenCalledWith({
        data: {
          userId: "u-1",
          source: XpSource.SCENARIO,
          amount: 50,
          refId: "sc-1",
        },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: { xp: 150, level: 1 },
      });
    });

    it("detects level up when crossing XP threshold", async () => {
      // Starting at 200 XP (L1), adding 60 XP reaches 260 XP (L2)
      const tx = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ xp: 200, level: 1 }),
          update: vi.fn().mockResolvedValue({}),
        },
        xpEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
        activityEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      } as unknown as Prisma.TransactionClient;

      const result = await awardXp(tx, "u-1", {
        source: XpSource.BOSS,
        amount: 60,
      });

      expect(result).toEqual({
        xp: 260,
        level: 2,
        leveledUp: { newLevel: 2 },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: { xp: 260, level: 2 },
      });
    });
  });

  describe("progressQuests", () => {
    it("advances quest progress and does not award XP if not yet completed", async () => {
      const mockQuests = [
        { id: "q1", type: "habit" as const, label: "Habits", target: 3, progress: 1, completed: false, xpReward: 20 },
      ];

      vi.spyOn(questsModule, "ensureTodayQuests").mockResolvedValue(mockQuests);

      const tx = {
        dailyQuest: {
          update: vi.fn().mockResolvedValue({}),
        },
      } as unknown as Prisma.TransactionClient;

      const completed = await progressQuests(tx, "u-1", "habit", 1);

      expect(completed).toEqual([]);
      expect(tx.dailyQuest.update).toHaveBeenCalledWith({
        where: { id: "q1" },
        data: { progress: 2, completed: false },
      });
    });

    it("completes quest and awards quest XP when reaching target", async () => {
      const mockQuests = [
        { id: "q1", type: "scenario" as const, label: "Scenario", target: 1, progress: 0, completed: false, xpReward: 30 },
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
        activityEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      } as unknown as Prisma.TransactionClient;

      const completed = await progressQuests(tx, "u-1", "scenario", 1);

      expect(completed).toHaveLength(1);
      expect(completed[0]?.completed).toBe(true);
      expect(completed[0]?.progress).toBe(1);

      expect(tx.dailyQuest.update).toHaveBeenCalledWith({
        where: { id: "q1" },
        data: { progress: 1, completed: true },
      });

      // Verifies quest XP awarded
      expect(tx.xpEvent.create).toHaveBeenCalledWith({
        data: {
          userId: "u-1",
          source: XpSource.QUEST,
          amount: 30,
          refId: "q1",
        },
      });
    });
  });

  describe("checkBadges", () => {
    it("skips badges already earned and awards newly qualifying ones", async () => {
      const mockBadges = [
        { id: "b1", key: "first-steps", name: "First Steps", description: "First scenario", objectKey: "medal", ruleType: "scenarios_completed", ruleValue: 1 },
        { id: "b2", key: "streak-7", name: "7-Day Streak", description: "Streak of 7", objectKey: "flame", ruleType: "streak_days", ruleValue: 7 },
      ];

      const tx = {
        badge: {
          findMany: vi.fn().mockResolvedValue(mockBadges),
        },
        userBadge: {
          findMany: vi.fn().mockResolvedValue([{ badgeId: "b1" }]), // b1 already earned
          create: vi.fn().mockResolvedValue({}),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ bestStreak: 7 }),
        },
        attempt: {
          count: vi.fn().mockResolvedValue(5),
          findMany: vi.fn().mockResolvedValue([]),
        },
        roleplaySession: {
          count: vi.fn().mockResolvedValue(0),
          findMany: vi.fn().mockResolvedValue([]),
        },
      } as unknown as Prisma.TransactionClient;

      const newlyEarned = await checkBadges(tx, "u-1");

      expect(newlyEarned).toHaveLength(1);
      expect(newlyEarned[0]?.key).toBe("streak-7");
      expect(tx.userBadge.create).toHaveBeenCalledWith({
        data: {
          userId: "u-1",
          badgeId: "b2",
          earnedAt: expect.any(Date),
        },
      });
    });
  });

  describe("touchStreak", () => {
    it("updates streak in database and returns streak result", async () => {
      const tx = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            currentStreak: 3,
            bestStreak: 5,
            lastActiveDate: null,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
      } as unknown as Prisma.TransactionClient;

      const result = await touchStreak(tx, "u-1");

      expect(result.currentStreak).toBe(1);
      expect(result.bestStreak).toBe(5);
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: {
          currentStreak: 1,
          bestStreak: 5,
          lastActiveDate: expect.any(Date),
        },
      });
    });
  });
});
