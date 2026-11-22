import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { gamificationRepo } from "@/data";
import { loadProfileView } from "./load";
import type { Badge, Quest, UserProfile } from "@/lib/types";

describe("loadProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads profile, badges, and quests concurrently using gamificationRepo", async () => {
    const mockProfile = {
      id: "u-test",
      name: "Tester",
      role: "employee" as const,
      email: "test@example.com",
      avatarKey: "buddy-2",
      teamName: "Alpha",
      level: 3,
      xp: 800,
      currentStreak: 5,
      bestStreak: 12,
      xpIntoLevel: 50,
      xpForNext: 750,
      xpToNext: 700,
      badges: [],
      stats: {
        scenariosCompleted: 4,
        perfectScores: 2,
        habitCheckIns: 10,
        averageScore: 92,
        scoreHistory: [],
        categoryMastery: [],
      },
    } satisfies UserProfile;

    const mockBadges: Badge[] = [
      {
        key: "first-step",
        name: "First Step",
        description: "First scenario done",
        objectKey: "medal",
        earnedAt: "2026-11-20T00:00:00Z",
      },
    ];

    const mockQuests: Quest[] = [
      {
        id: "q-1",
        type: "scenario",
        label: "Complete 1 scenario",
        target: 1,
        progress: 1,
        completed: true,
        xpReward: 50,
      },
    ];

    const getProfileSpy = vi.spyOn(gamificationRepo, "getProfile").mockResolvedValue(mockProfile);
    const listBadgesSpy = vi.spyOn(gamificationRepo, "listBadges").mockResolvedValue(mockBadges);
    const listQuestsSpy = vi.spyOn(gamificationRepo, "listQuests").mockResolvedValue(mockQuests);

    const result = await loadProfileView("u-test");

    expect(getProfileSpy).toHaveBeenCalledWith("u-test");
    expect(listBadgesSpy).toHaveBeenCalledWith("u-test");
    expect(listQuestsSpy).toHaveBeenCalledWith("u-test");

    expect(result).toEqual({
      profile: mockProfile,
      badges: mockBadges,
      quests: mockQuests,
    });
  });

  it("works with real mock repo values when not spied", async () => {
    const result = await loadProfileView("u-me");

    expect(result.profile).toBeDefined();
    expect(result.profile.id).toBeDefined();
    expect(Array.isArray(result.badges)).toBe(true);
    expect(Array.isArray(result.quests)).toBe(true);
  });
});
