import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { QUEST_DEFS, ensureTodayQuests, toQuest } from "./quests";
import type { Prisma } from "@/generated/prisma/client";

describe("quests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("QUEST_DEFS", () => {
    it("defines the expected 3 quests", () => {
      expect(QUEST_DEFS).toHaveLength(3);
      const types = QUEST_DEFS.map((q) => q.type);
      expect(types).toEqual(["scenario", "habit", "stars"]);

      const scenario = QUEST_DEFS.find((q) => q.type === "scenario");
      expect(scenario).toEqual({
        type: "scenario",
        label: "Finish 1 scenario",
        target: 1,
        xpReward: 30,
      });

      const habit = QUEST_DEFS.find((q) => q.type === "habit");
      expect(habit).toEqual({
        type: "habit",
        label: "Clock in today",
        target: 1,
        xpReward: 20,
      });

      const stars = QUEST_DEFS.find((q) => q.type === "stars");
      expect(stars).toEqual({
        type: "stars",
        label: "Score 2 stars or more",
        target: 1,
        xpReward: 25,
      });
    });
  });

  describe("toQuest", () => {
    it("maps raw dailyQuest row to Quest domain object", () => {
      const q = toQuest({
        id: "dq-1",
        type: "scenario",
        target: 1,
        progress: 1,
        completed: true,
      });

      expect(q).toEqual({
        id: "dq-1",
        type: "scenario",
        label: "Finish 1 scenario",
        target: 1,
        progress: 1,
        completed: true,
        xpReward: 30,
      });
    });
  });

  describe("ensureTodayQuests", () => {
    it("creates missing quests when user has none today", async () => {
      const mockCreated = [
        { id: "q1", type: "scenario", target: 1, progress: 0, completed: false },
        { id: "q2", type: "habit", target: 1, progress: 0, completed: false },
        { id: "q3", type: "stars", target: 1, progress: 0, completed: false },
      ];

      const findMany = vi.fn().mockResolvedValue([]);
      const create = vi
        .fn()
        .mockImplementation(({ data }: { data: { type: string } }) => {
          return mockCreated.find((c) => c.type === data.type);
        });

      const tx = {
        dailyQuest: {
          findMany,
          create,
        },
      } as unknown as Prisma.TransactionClient;

      const quests = await ensureTodayQuests(tx, "u-123");

      expect(findMany).toHaveBeenCalled();
      expect(create).toHaveBeenCalledTimes(3);
      expect(quests).toHaveLength(3);
      expect(quests[0]?.type).toBe("scenario");
      expect(quests[1]?.type).toBe("habit");
      expect(quests[2]?.type).toBe("stars");
    });

    it("returns existing quests without recreating when all exist", async () => {
      const existing = [
        { id: "q2", type: "habit", target: 3, progress: 2, completed: false },
        { id: "q1", type: "scenario", target: 1, progress: 1, completed: true },
        { id: "q3", type: "stars", target: 1, progress: 0, completed: false },
      ];

      const findMany = vi.fn().mockResolvedValue(existing);
      const create = vi.fn();

      const tx = {
        dailyQuest: {
          findMany,
          create,
        },
      } as unknown as Prisma.TransactionClient;

      const quests = await ensureTodayQuests(tx, "u-123");

      expect(findMany).toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(quests).toHaveLength(3);
      expect(quests[0]?.type).toBe("scenario");
      expect(quests[1]?.type).toBe("habit");
      expect(quests[2]?.type).toBe("stars");
      expect(quests[0]?.completed).toBe(true);
      expect(quests[1]?.progress).toBe(2);
    });
  });
});
