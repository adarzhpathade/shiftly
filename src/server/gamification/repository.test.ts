import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    badge: {
      findMany: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({})),
  },
}));
vi.mock("@/server/progress/stats", () => ({
  getUserStats: vi.fn(),
}));
vi.mock("@/server/progress/quests", () => ({
  ensureTodayQuests: vi.fn(),
}));

import { realGamificationRepo } from "./repository";
import { db } from "@/server/db";
import { getUserStats } from "@/server/progress/stats";
import { ensureTodayQuests } from "@/server/progress/quests";
import type { UserStats } from "@/lib/types";

describe("realGamificationRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("returns formatted UserProfile", async () => {
      const mockDbUser = {
        id: "u-1",
        name: "Test User",
        email: "test@example.com",
        role: "EMPLOYEE",
        avatarKey: "buddy-1",
        team: { name: "Team Support" },
        xp: 1250,
        level: 3,
        currentStreak: 4,
        bestStreak: 8,
      };

      const mockStats: UserStats = {
        scenariosCompleted: 3,
        perfectScores: 1,
        habitCheckIns: 12,
        bossWins: 1,
        averageScore: 88,
        scoreHistory: [],
        categoryMastery: [],
      };

      const mockBadges = [
        { id: "b1", key: "first-steps", name: "First Steps", description: "Done 1", objectKey: "medal" },
      ];

      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as never);
      vi.mocked(db.badge.findMany).mockResolvedValue(mockBadges as never);
      vi.mocked(db.userBadge.findMany).mockResolvedValue([{ badgeId: "b1", earnedAt: new Date("2026-11-20T00:00:00Z") }] as never);
      vi.mocked(getUserStats).mockResolvedValue(mockStats);

      const profile = await realGamificationRepo.getProfile("u-1");

      expect(profile.id).toBe("u-1");
      expect(profile.name).toBe("Test User");
      expect(profile.role).toBe("employee");
      expect(profile.teamName).toBe("Team Support");
      expect(profile.xp).toBe(1250);
      expect(profile.badges).toHaveLength(1);
      expect(profile.badges[0]?.earnedAt).toBe("2026-11-20T00:00:00.000Z");
      expect(profile.stats).toEqual(mockStats);
    });

    it("throws when user is not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(realGamificationRepo.getProfile("u-unknown")).rejects.toThrow("User not found: u-unknown");
    });
  });

  describe("listBadges", () => {
    it("returns all badges with earnedAt set or null", async () => {
      const mockBadges = [
        { id: "b1", key: "first-steps", name: "First Steps", description: "Done 1", objectKey: "medal" },
        { id: "b2", key: "streak-7", name: "7-Day Streak", description: "Streak", objectKey: "flame" },
      ];

      vi.mocked(db.badge.findMany).mockResolvedValue(mockBadges as never);
      vi.mocked(db.userBadge.findMany).mockResolvedValue([
        { badgeId: "b1", earnedAt: new Date("2026-11-20T00:00:00Z") },
      ] as never);

      const badges = await realGamificationRepo.listBadges("u-1");

      expect(badges).toHaveLength(2);
      expect(badges.find((b) => b.key === "first-steps")?.earnedAt).toBe("2026-11-20T00:00:00.000Z");
      expect(badges.find((b) => b.key === "streak-7")?.earnedAt).toBeNull();
    });
  });

  describe("listQuests", () => {
    it("calls ensureTodayQuests inside a transaction", async () => {
      const mockQuests = [
        { id: "q1", type: "scenario" as const, label: "Scenario", target: 1, progress: 0, completed: false, xpReward: 30 },
      ];

      vi.mocked(ensureTodayQuests).mockResolvedValue(mockQuests);

      const quests = await realGamificationRepo.listQuests("u-1");

      expect(db.$transaction).toHaveBeenCalled();
      expect(ensureTodayQuests).toHaveBeenCalled();
      expect(quests).toEqual(mockQuests);
    });
  });
});
