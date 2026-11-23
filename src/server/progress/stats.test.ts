import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  computeAverageScore,
  computeCategoryMastery,
  getUserStats,
  CATEGORY_KEYS,
} from "./stats";
import type { PrismaClient } from "@/generated/prisma/client";

describe("stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeAverageScore (pure)", () => {
    it("returns 0 for empty array", () => {
      expect(computeAverageScore([])).toBe(0);
    });

    it("computes average and rounds to nearest integer", () => {
      expect(computeAverageScore([80, 90, 85])).toBe(85);
      expect(computeAverageScore([70, 75])).toBe(73); // 72.5 -> 73
    });
  });

  describe("computeCategoryMastery (pure)", () => {
    it("returns mastery for all 4 categories", () => {
      const result = computeCategoryMastery({
        guidedStars: {
          "sc-1": 3,
          "sc-2": 3,
        },
        bossStars: {
          "handling-complaints": 3,
        },
        scenarioCategories: {
          "sc-1": "handling-complaints",
          "sc-2": "handling-complaints",
        },
      });

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.categoryKey)).toEqual(CATEGORY_KEYS);

      const hc = result.find((r) => r.categoryKey === "handling-complaints");
      // 3 + 3 + 3 = 9 stars out of 15 => 0.6
      expect(hc?.mastery).toBe(0.6);

      const cq = result.find((r) => r.categoryKey === "customer-queries");
      expect(cq?.mastery).toBe(0);
    });
  });

  describe("getUserStats", () => {
    it("aggregates database rows into UserStats domain object", async () => {
      const mockAttempts = [
        {
          score: 80,
          stars: 2,
          completedAt: new Date("2026-11-20T10:00:00Z"),
          scenarioId: "sc-1",
          scenario: { category: { slug: "handling-complaints" } },
        },
        {
          score: 100,
          stars: 3,
          completedAt: new Date("2026-11-22T10:00:00Z"),
          scenarioId: "sc-2",
          scenario: { category: { slug: "handling-complaints" } },
        },
      ];

      const mockBossSessions = [
        {
          stars: 3,
          persona: { category: { slug: "handling-complaints" } },
        },
      ];

      const db = {
        attempt: {
          count: vi.fn().mockImplementation(({ where }: { where: { stars?: number } }) => {
            if (where.stars === 3) return Promise.resolve(1);
            return Promise.resolve(2);
          }),
          findMany: vi.fn().mockResolvedValue(mockAttempts),
        },
        habitLog: {
          count: vi.fn().mockResolvedValue(15),
        },
        roleplaySession: {
          count: vi.fn().mockResolvedValue(1),
          findMany: vi.fn().mockResolvedValue(mockBossSessions),
        },
      } as unknown as PrismaClient;

      const stats = await getUserStats(db, "u-1");

      expect(stats.scenariosCompleted).toBe(2);
      expect(stats.perfectScores).toBe(1);
      expect(stats.habitCheckIns).toBe(15);
      expect(stats.bossWins).toBe(1);
      expect(stats.averageScore).toBe(90);
      expect(stats.scoreHistory).toHaveLength(2);
      expect(stats.categoryMastery).toHaveLength(4);
    });
  });
});
