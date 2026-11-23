import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    attempt: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("@/server/training/repository", () => ({
  CHALLENGE_SCENARIO_ID: "sc-hc-3",
  CHALLENGE_BONUS_XP: 25,
  realTrainingRepo: {
    listCategories: vi.fn(),
    getLevelPath: vi.fn(),
    getGuidedScenario: vi.fn(),
  },
}));
vi.mock("@/data", () => ({
  habitRepo: {
    listToday: vi.fn(),
  },
  gamificationRepo: {
    listQuests: vi.fn(),
  },
}));

import { realHomeRepo } from "./repository";
import { db } from "@/server/db";
import { realTrainingRepo } from "@/server/training/repository";
import { habitRepo, gamificationRepo } from "@/data";
import type { LevelNode } from "@/lib/types";

describe("realHomeRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds HomeData successfully", async () => {
    const mockUser = {
      id: "u-1",
      name: "Mayur",
      avatarKey: "buddy-1",
      team: { name: "Support Team A" },
      xp: 500,
      currentStreak: 4,
    };

    const mockCategories = [
      {
        key: "handling-complaints" as const,
        name: "Handling Complaints",
        colorToken: "peach" as const,
        objectKey: "megaphone",
        description: "Desc",
        progress: { completedLevels: 1, totalLevels: 5, stars: 2, maxStars: 15, mastery: 2 / 15 },
      },
    ];

    const mockNodes: readonly LevelNode[] = [
      { level: 1, kind: "guided", title: "L1", stars: 2, locked: false, scenarioId: "sc-1" },
      { level: 2, kind: "guided", title: "L2", stars: 0, locked: false, scenarioId: "sc-2" },
    ];

    const mockChallenge = {
      id: "sc-hc-3",
      title: "Double Charge",
      categoryKey: "handling-complaints" as const,
      difficulty: "intermediate" as const,
      stepCount: 2,
      xpReward: 150,
      situation: "Sit",
      customer: { name: "Cust", avatarKey: "buddy-1" },
      steps: [],
    };

    vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(realTrainingRepo.listCategories).mockResolvedValue(mockCategories);
    vi.mocked(realTrainingRepo.getLevelPath).mockResolvedValue(mockNodes);
    vi.mocked(realTrainingRepo.getGuidedScenario).mockResolvedValue(mockChallenge);
    vi.mocked(db.attempt.findFirst).mockResolvedValue(null); // challenge not done today
    vi.mocked(habitRepo.listToday).mockResolvedValue([]);
    vi.mocked(gamificationRepo.listQuests).mockResolvedValue([]);

    const home = await realHomeRepo.getHome("u-1");

    expect(home.user.id).toBe("u-1");
    expect(home.user.name).toBe("Mayur");
    expect(home.streak).toBe(4);
    expect(home.continueTraining).toEqual({
      categoryKey: "handling-complaints",
      categoryName: "Handling Complaints",
      node: mockNodes[1],
    });
    expect(home.challenge.completedToday).toBe(false);
    expect(home.challenge.bonusXp).toBe(25);
    expect(home.categories).toEqual(mockCategories);
  });
});
