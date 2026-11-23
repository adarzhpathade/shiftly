import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/progress/award", () => ({
  progressQuests: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/server/db", () => {
  const mockTx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    user: {
      findUnique: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    activityEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };
  return {
    db: {
      ...mockTx,
      $transaction: vi.fn(async (callback) => callback(mockTx)),
    },
  };
});

import { ActivityType } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { progressQuests } from "@/server/progress/award";
import { recordActivity, realActivityRepo } from "./repository";

describe("activity repository", () => {
  const mockTx = db as unknown as {
    $executeRaw: ReturnType<typeof vi.fn>;
    user: { findUnique: ReturnType<typeof vi.fn> };
    category: { findUnique: ReturnType<typeof vi.fn> };
    activityEvent: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.user.findUnique.mockResolvedValue({ id: "u-1" });
    mockTx.category.findUnique.mockResolvedValue({ id: "cat-hc" });
    mockTx.activityEvent.findFirst.mockResolvedValue(null);
    mockTx.activityEvent.create.mockResolvedValue({ id: "ae-1" });
  });

  describe("record inserts the right row", () => {
    it("inserts training_finished event with category and stars", async () => {
      const result = await realActivityRepo.record("u-1", {
        type: "training_finished",
        categoryKey: "handling-complaints",
        stars: 2,
      });

      expect(result).toEqual({
        recorded: true,
        stageUps: [],
        xpEarned: 0,
      });

      expect(mockTx.activityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "u-1",
          type: ActivityType.TRAINING_FINISHED,
          categoryId: "cat-hc",
          stars: 2,
          meta: undefined,
        }),
      });
    });

    it("inserts perfect_score event with category and stars=3", async () => {
      const result = await realActivityRepo.record("u-1", {
        type: "perfect_score",
        categoryKey: "handling-complaints",
      });

      expect(result.recorded).toBe(true);
      expect(mockTx.activityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "u-1",
          type: ActivityType.PERFECT_SCORE,
          categoryId: "cat-hc",
          stars: 3,
        }),
      });
    });

    it("inserts boss_finished event with won in meta", async () => {
      const result = await realActivityRepo.record("u-1", {
        type: "boss_finished",
        categoryKey: "handling-complaints",
        won: true,
        stars: 3,
      });

      expect(result.recorded).toBe(true);
      expect(mockTx.activityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "u-1",
          type: ActivityType.BOSS_FINISHED,
          categoryId: "cat-hc",
          stars: 3,
          meta: { won: true },
        }),
      });
    });

    it("inserts boss_finished event with won:false in meta when lost", async () => {
      const result = await realActivityRepo.record("u-1", {
        type: "boss_finished",
        categoryKey: "handling-complaints",
        won: false,
        stars: 0,
      });

      expect(result.recorded).toBe(true);
      expect(mockTx.activityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "u-1",
          type: ActivityType.BOSS_FINISHED,
          stars: 0,
          meta: { won: false },
        }),
      });
    });

    it("inserts quest_completed event with questId in meta", async () => {
      const result = await realActivityRepo.record("u-1", {
        type: "quest_completed",
        questId: "quest-abc-123",
      });

      expect(result.recorded).toBe(true);
      expect(mockTx.activityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "u-1",
          type: ActivityType.QUEST_COMPLETED,
          meta: { questId: "quest-abc-123" },
        }),
      });
    });

    it("inserts daily_open event and triggers progressQuests for habit", async () => {
      const result = await realActivityRepo.record("u-1", {
        type: "daily_open",
      });

      expect(result.recorded).toBe(true);
      expect(mockTx.$executeRaw).toHaveBeenCalled();
      expect(mockTx.activityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "u-1",
          type: ActivityType.DAILY_OPEN,
        }),
      });
      expect(progressQuests).toHaveBeenCalledWith(expect.anything(), "u-1", "habit");
    });
  });

  describe("daily_open dedupe across the IST midnight", () => {
    it("deduplicates daily_open on the same IST day", async () => {
      // First attempt on 2026-11-23 at 23:50 IST
      mockTx.activityEvent.findFirst.mockResolvedValueOnce(null);
      const res1 = await realActivityRepo.record("u-1", {
        type: "daily_open",
        at: "2026-11-23T23:50:00+05:30",
      });
      expect(res1.recorded).toBe(true);
      expect(mockTx.activityEvent.create).toHaveBeenCalledTimes(1);

      // Second attempt on the same day at 23:55 IST
      mockTx.activityEvent.findFirst.mockResolvedValueOnce({ id: "ae-daily-1" });
      const res2 = await realActivityRepo.record("u-1", {
        type: "daily_open",
        at: "2026-11-23T23:55:00+05:30",
      });
      expect(res2).toEqual({
        recorded: false,
        stageUps: [],
        xpEarned: 0,
      });
      // Should not insert another row or call progressQuests again
      expect(mockTx.activityEvent.create).toHaveBeenCalledTimes(1);
    });

    it("allows recording a new daily_open after passing IST midnight", async () => {
      // Event right before midnight (2026-11-23 23:59:50+05:30)
      mockTx.activityEvent.findFirst.mockResolvedValueOnce(null);
      const res1 = await realActivityRepo.record("u-1", {
        type: "daily_open",
        at: "2026-11-23T23:59:50+05:30",
      });
      expect(res1.recorded).toBe(true);

      const findFirstCall1 = mockTx.activityEvent.findFirst.mock.calls[0]?.[0];
      expect(findFirstCall1.where.createdAt.gte.toISOString()).toBe("2026-11-22T18:30:00.000Z");
      expect(findFirstCall1.where.createdAt.lt.toISOString()).toBe("2026-11-23T18:30:00.000Z");

      // Event right after midnight (2026-11-24 00:00:10+05:30)
      mockTx.activityEvent.findFirst.mockResolvedValueOnce(null);
      const res2 = await realActivityRepo.record("u-1", {
        type: "daily_open",
        at: "2026-11-24T00:00:10+05:30",
      });
      expect(res2.recorded).toBe(true);

      const findFirstCall2 = mockTx.activityEvent.findFirst.mock.calls[1]?.[0];
      expect(findFirstCall2.where.createdAt.gte.toISOString()).toBe("2026-11-23T18:30:00.000Z");
      expect(findFirstCall2.where.createdAt.lt.toISOString()).toBe("2026-11-24T18:30:00.000Z");
    });
  });

  describe("unknown user throws", () => {
    it("throws for unknown user across every event type", async () => {
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(
        realActivityRepo.record("unknown-user", {
          type: "daily_open",
        }),
      ).rejects.toThrow("User not found: unknown-user");

      await expect(
        recordActivity(mockTx as never, "unknown-user", {
          type: "training_finished",
          categoryKey: "customer-queries",
          stars: 1,
        }),
      ).rejects.toThrow("User not found: unknown-user");

      await expect(
        recordActivity(mockTx as never, "unknown-user", {
          type: "boss_finished",
          categoryKey: "customer-queries",
          won: true,
          stars: 2,
        }),
      ).rejects.toThrow("User not found: unknown-user");

      await expect(
        recordActivity(mockTx as never, "unknown-user", {
          type: "quest_completed",
          questId: "q-1",
        }),
      ).rejects.toThrow("User not found: unknown-user");

      await expect(
        recordActivity(mockTx as never, "unknown-user", {
          type: "perfect_score",
          categoryKey: "problem-solving",
        }),
      ).rejects.toThrow("User not found: unknown-user");

      expect(mockTx.activityEvent.create).not.toHaveBeenCalled();
    });
  });
});
