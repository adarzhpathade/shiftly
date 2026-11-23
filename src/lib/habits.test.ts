import { describe, expect, it } from "vitest";
import { buildCelebrations } from "./celebrations";
import { dayPartForHour, habitKeyFor, isoWeekKey, toHomeHabits } from "./habits";
import type { DetectedHabit, HabitsOverview } from "./types";

function habit(over: Partial<DetectedHabit>): DetectedHabit {
  return {
    key: "trains",
    kind: "trains",
    categoryKey: null,
    title: "Trains",
    description: "",
    icon: "book",
    usualDays: [1],
    usualWindow: null,
    stage: "forming",
    status: "on_track",
    currentStreak: 1,
    bestStreak: 1,
    consistency: 0.5,
    doneToday: false,
    heatmap: [],
    lastSeenAt: "2026-11-23T00:00:00.000Z",
    ...over,
  };
}

function overview(habits: DetectedHabit[], firstHabits: HabitsOverview["firstHabits"] = null): HabitsOverview {
  return {
    habits,
    fadingCount: 0,
    nextHabit: null,
    insights: { bestTimeOfDay: null, mostSkippedWeekday: null, skillLink: null, streakAtRisk: null },
    coachNote: { isoWeek: "2026-W47", lines: ["a", "b", "c"], source: "rules", generatedAt: "2026-11-23T00:00:00.000Z" },
    firstHabits,
  };
}

describe("isoWeekKey", () => {
  it("numbers ISO weeks (Monday start, week 1 holds the first Thursday)", () => {
    expect(isoWeekKey("2026-11-23")).toBe("2026-W48");
    expect(isoWeekKey("2026-11-22")).toBe("2026-W47");
    expect(isoWeekKey("2026-01-01")).toBe("2026-W01");
    expect(isoWeekKey("2027-01-01")).toBe("2026-W53");
    expect(isoWeekKey("2024-12-30")).toBe("2025-W01");
  });
});

describe("dayPartForHour", () => {
  it("maps hours to day parts", () => {
    expect(dayPartForHour(5)).toBe("morning");
    expect(dayPartForHour(11)).toBe("morning");
    expect(dayPartForHour(12)).toBe("afternoon");
    expect(dayPartForHour(17)).toBe("evening");
    expect(dayPartForHour(22)).toBe("night");
    expect(dayPartForHour(3)).toBe("night");
  });
});

describe("habitKeyFor", () => {
  it("adds the category only for category habits", () => {
    expect(habitKeyFor("plays-category", "difficult-customers")).toBe("plays-category:difficult-customers");
    expect(habitKeyFor("clocks-in", null)).toBe("clocks-in");
    expect(habitKeyFor("trains", "problem-solving")).toBe("trains");
  });
});

describe("toHomeHabits", () => {
  it("lists up to 3 live habits, slipping first, and counts slipping", () => {
    const home = toHomeHabits(
      overview([
        habit({ key: "a", status: "on_track" }),
        habit({ key: "b", status: "slipping" }),
        habit({ key: "c", status: "on_track" }),
        habit({ key: "d", status: "on_track" }),
      ]),
    );
    expect(home.items.map((i) => i.key)).toEqual(["b", "a", "c"]);
    expect(home.slippingCount).toBe(1);
    expect(home.firstHabitsProgress).toBeNull();
  });

  it("carries the first-habits progress while there are no habits", () => {
    const home = toHomeHabits(overview([], { progress: 0.33, occurrences: 1, needed: 3, hint: "x" }));
    expect(home.items).toEqual([]);
    expect(home.firstHabitsProgress).toBe(0.33);
  });
});

describe("habit stage celebrations", () => {
  it("turns stage-ups into celebration events before the level-up", () => {
    const events = buildCelebrations({
      leveledUp: { newLevel: 4 },
      stageUps: [{ habitKey: "trains", title: "Trains on weekday evenings", stage: "building", xpBonus: 15 }],
    });
    expect(events).toEqual([
      { type: "habit-stage", habitTitle: "Trains on weekday evenings", stage: "building", xpReward: 15 },
      { type: "level-up", level: 4 },
    ]);
  });
});
