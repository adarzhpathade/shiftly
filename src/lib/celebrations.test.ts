import { describe, expect, it } from "vitest";
import { buildCelebrations, type CelebrationEvent } from "./celebrations";
import type { Badge, Quest } from "./types";

const badge1: Badge = {
  key: "first-step",
  name: "First Step",
  description: "Complete first scenario",
  objectKey: "medal",
  earnedAt: "2026-01-01T00:00:00.000Z",
};

const badge2: Badge = {
  key: "streak-master",
  name: "Streak Master",
  description: "Keep streak alive",
  objectKey: "flame",
  earnedAt: "2026-01-02T00:00:00.000Z",
};

const quest1: Quest = {
  id: "q-1",
  type: "scenario",
  label: "Complete a scenario",
  target: 1,
  progress: 1,
  completed: true,
  xpReward: 50,
};

const quest2: Quest = {
  id: "q-2",
  type: "habit",
  label: "Check in 2 habits",
  target: 2,
  progress: 2,
  completed: true,
  xpReward: 30,
};

describe("buildCelebrations", () => {
  it("returns empty array for an empty input or empty lists", () => {
    expect(buildCelebrations({})).toEqual([]);
    expect(buildCelebrations({ newBadges: [], questsCompleted: [] })).toEqual([]);
  });

  it("builds each kind individually", () => {
    expect(buildCelebrations({ leveledUp: { newLevel: 4 } })).toEqual<CelebrationEvent[]>([
      { type: "level-up", level: 4 },
    ]);
    expect(buildCelebrations({ milestone: 7 })).toEqual<CelebrationEvent[]>([
      { type: "streak", days: 7 },
    ]);
    expect(buildCelebrations({ milestone: 30 })).toEqual<CelebrationEvent[]>([
      { type: "streak", days: 30 },
    ]);
    expect(buildCelebrations({ milestone: 100 })).toEqual<CelebrationEvent[]>([
      { type: "streak", days: 100 },
    ]);
    expect(buildCelebrations({ newBadges: [badge1] })).toEqual<CelebrationEvent[]>([
      {
        type: "badge",
        badge: {
          key: "first-step",
          name: "First Step",
          description: "Complete first scenario",
          objectKey: "medal",
        },
      },
    ]);
    expect(buildCelebrations({ questsCompleted: [quest1] })).toEqual<CelebrationEvent[]>([
      { type: "quest", label: "Complete a scenario", xpReward: 50 },
    ]);
  });

  it("orders events: quests, badges, streak, level-up last", () => {
    const result = buildCelebrations({
      leveledUp: { newLevel: 2 },
      milestone: 30,
      newBadges: [badge1, badge2],
      questsCompleted: [quest1, quest2],
    });

    expect(result).toEqual<CelebrationEvent[]>([
      { type: "quest", label: "Complete a scenario", xpReward: 50 },
      { type: "quest", label: "Check in 2 habits", xpReward: 30 },
      {
        type: "badge",
        badge: {
          key: "first-step",
          name: "First Step",
          description: "Complete first scenario",
          objectKey: "medal",
        },
      },
      {
        type: "badge",
        badge: {
          key: "streak-master",
          name: "Streak Master",
          description: "Keep streak alive",
          objectKey: "flame",
        },
      },
      { type: "streak", days: 30 },
      { type: "level-up", level: 2 },
    ]);
  });

  it("skips absent parts while preserving relative ordering", () => {
    const withoutStreakOrBadges = buildCelebrations({
      leveledUp: { newLevel: 5 },
      questsCompleted: [quest1],
    });
    expect(withoutStreakOrBadges).toEqual<CelebrationEvent[]>([
      { type: "quest", label: "Complete a scenario", xpReward: 50 },
      { type: "level-up", level: 5 },
    ]);

    const onlyBadgesAndStreak = buildCelebrations({
      milestone: 7,
      newBadges: [badge1],
    });
    expect(onlyBadgesAndStreak).toEqual<CelebrationEvent[]>([
      {
        type: "badge",
        badge: {
          key: "first-step",
          name: "First Step",
          description: "Complete first scenario",
          objectKey: "medal",
        },
      },
      { type: "streak", days: 7 },
    ]);
  });
});
