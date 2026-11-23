import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/gamification";
import type { CoachNote } from "@/lib/types";
import {
  analyzeHabits,
  buildHabitDetail,
  computeFirstHabits,
  computeInsights,
  computeNextHabit,
  detectHabits,
  hasWindowEnded,
  toKolkataDate,
  toKolkataHour,
  type CategoryInfo,
  type RawActivityEvent,
} from "./analyzer";

const MOCK_CATEGORIES: CategoryInfo[] = [
  { key: "handling-complaints", name: "Handling Complaints", mastery: 0.8, stars: 12, objectKey: "megaphone" },
  { key: "customer-queries", name: "Customer Queries", mastery: 0.6, stars: 8, objectKey: "bubble" },
  { key: "difficult-customers", name: "Difficult Customers", mastery: 0.2, stars: 3, objectKey: "target" },
  { key: "problem-solving", name: "Problem Solving", mastery: 0.5, stars: 6, objectKey: "handshake" },
];

const DUMMY_COACH_NOTE: CoachNote = {
  isoWeek: "2026-W48",
  lines: ["Note 1", "Note 2", "Note 3"],
  source: "rules",
  generatedAt: "2026-11-23T12:00:00.000Z",
};

describe("analyzer", () => {
  // Use a fixed Wednesday at 14:00 IST (08:30 UTC)
  // Date in IST: 2026-11-25 (Wednesday)
  const baseNow = new Date("2026-11-25T08:30:00.000Z");
  const today = toKolkataDate(baseNow); // "2026-11-25"

  it("1. empty history (new user)", () => {
    const habits = detectHabits([], MOCK_CATEGORIES, baseNow);
    expect(habits).toEqual([]);

    const insights = computeInsights([], [], baseNow);
    expect(insights.bestTimeOfDay).toBeNull();
    expect(insights.mostSkippedWeekday).toBeNull();
    expect(insights.skillLink).toBeNull();
    expect(insights.streakAtRisk).toBeNull();

    const nextHabit = computeNextHabit([], habits, MOCK_CATEGORIES, baseNow);
    expect(nextHabit).toBeNull(); // No training data yet

    const firstHabits = computeFirstHabits([], habits, baseNow);
    expect(firstHabits).not.toBeNull();
    expect(firstHabits?.progress).toBe(0);
    expect(firstHabits?.occurrences).toBe(0);
    expect(firstHabits?.needed).toBe(3);

    const overview = analyzeHabits([], MOCK_CATEGORIES, baseNow, DUMMY_COACH_NOTE);
    expect(overview.habits).toEqual([]);
    expect(overview.fadingCount).toBe(0);
    expect(overview.nextHabit).toBeNull();
    expect(overview.firstHabits).toEqual(firstHabits);
  });

  it("2. exactly at / below detection threshold (2 vs 3 distinct days)", () => {
    // 2 distinct days in the last 14 days
    const eventsBelow: RawActivityEvent[] = [
      { type: "training_finished", createdAt: `${today}T09:00:00.000Z` },
      { type: "training_finished", createdAt: `${today}T11:00:00.000Z` }, // Same day, multiple events
      { type: "training_finished", createdAt: `${addDays(today, -2)}T09:00:00.000Z` },
    ];

    const habitsBelow = detectHabits(eventsBelow, MOCK_CATEGORIES, baseNow);
    expect(habitsBelow).toEqual([]);

    const firstHabitsBelow = computeFirstHabits(eventsBelow, habitsBelow, baseNow);
    expect(firstHabitsBelow?.occurrences).toBe(2);
    expect(firstHabitsBelow?.progress).toBeCloseTo(2 / 3);

    // 3 distinct days in the last 14 days
    const eventsAt: RawActivityEvent[] = [
      ...eventsBelow,
      { type: "training_finished", createdAt: `${addDays(today, -5)}T09:00:00.000Z` },
    ];

    const habitsAt = detectHabits(eventsAt, MOCK_CATEGORIES, baseNow);
    expect(habitsAt.length).toBe(1);
    expect(habitsAt[0]?.key).toBe("trains");
    expect(habitsAt[0]?.stage).toBe("forming");

    const firstHabitsAt = computeFirstHabits(eventsAt, habitsAt, baseNow);
    expect(firstHabitsAt).toBeNull(); // Once habit is detected, firstHabits is null
  });

  it("3. stage boundaries: forming -> building (2 full weeks) -> solid (4 full weeks + 80% consistency)", () => {
    // Today is Wednesday 2026-11-25.
    // Current week started Mon 2026-11-23.
    // Week -1: Mon 2026-11-16 to Sun 2026-11-22
    // Week -2: Mon 2026-11-09 to Sun 2026-11-15
    // Week -3: Mon 2026-11-02 to Sun 2026-11-08
    // Week -4: Mon 2026-10-26 to Sun 2026-11-01

    // Let's create clocks-in habit on weekdays (Mon..Fri)
    // For a week to count with usualDays [1, 2, 3, 4, 5], 60% of 5 is 3 hits.
    const createClocksInEvents = (weeksBack: number[]): RawActivityEvent[] => {
      const evs: RawActivityEvent[] = [
        // Also clock in today and 2 days ago so it's detected and on track
        { type: "daily_open", createdAt: `${today}T02:00:00.000Z` },
        { type: "daily_open", createdAt: `${addDays(today, -1)}T02:00:00.000Z` },
        { type: "daily_open", createdAt: `${addDays(today, -2)}T02:00:00.000Z` },
      ];

      for (const wb of weeksBack) {
        const weekMon = addDays("2026-11-23", -wb * 7);
        // Hits on Mon, Tue, Wed, Thu, Fri (5 hits = 100% of usual days)
        for (let d = 0; d < 5; d++) {
          evs.push({
            type: "daily_open",
            createdAt: `${addDays(weekMon, d)}T02:30:00.000Z`,
          });
        }
      }
      return evs;
    };

    // Case A: Only week -1 -> forming (needs 2 weeks for building)
    const evs1Week = createClocksInEvents([1]);
    const habits1Week = detectHabits(evs1Week, MOCK_CATEGORIES, baseNow);
    expect(habits1Week.find((h) => h.key === "clocks-in")?.stage).toBe("forming");

    // Case B: Weeks -1 and -2 -> building
    const evs2Weeks = createClocksInEvents([1, 2]);
    const habits2Weeks = detectHabits(evs2Weeks, MOCK_CATEGORIES, baseNow);
    expect(habits2Weeks.find((h) => h.key === "clocks-in")?.stage).toBe("building");

    // Case C: Weeks -1, -2, -3, -4 with 100% hits -> solid
    const evs4Weeks = createClocksInEvents([1, 2, 3, 4]);
    const habits4Weeks = detectHabits(evs4Weeks, MOCK_CATEGORIES, baseNow);
    const solidHabit = habits4Weeks.find((h) => h.key === "clocks-in");
    expect(solidHabit?.stage).toBe("solid");
    expect(solidHabit?.consistency).toBeGreaterThanOrEqual(0.8);
  });

  it("4. slipping after a missed usual day", () => {
    // Usual days include Monday and Tuesday (each hit >= 2 times in 28 days).
    // Today is Wed 2026-11-25.
    // Tuesday 2026-11-24 was missed!
    const events: RawActivityEvent[] = [
      { type: "daily_open", createdAt: "2026-11-23T03:00:00.000Z" }, // Mon 23 hit
      { type: "daily_open", createdAt: "2026-11-16T03:00:00.000Z" }, // Mon 16 hit
      // Tue 2026-11-24 MISSED
      { type: "daily_open", createdAt: "2026-11-17T03:00:00.000Z" }, // Tue 17 hit
      { type: "daily_open", createdAt: "2026-11-10T03:00:00.000Z" }, // Tue 10 hit
    ];

    const habits = detectHabits(events, MOCK_CATEGORIES, baseNow);
    const habit = habits.find((h) => h.key === "clocks-in");
    expect(habit).toBeDefined();
    expect(habit?.status).toBe("slipping");
    // When a past usual day was missed, current streak is 0
    expect(habit?.currentStreak).toBe(0);
  });

  it("4b. streak is 0 if a past usual day was missed even if the behaviour happened today", () => {
    // Usual days include Monday, Tuesday, Wednesday (each hit >= 2 times in 28 days).
    // Today is Wed 2026-11-25.
    // Tuesday 2026-11-24 was missed!
    // Behaviour happened today on Wednesday (doneToday = true).
    const events: RawActivityEvent[] = [
      { type: "daily_open", createdAt: "2026-11-25T03:00:00.000Z" }, // Wed 25 (TODAY - done!)
      // Tue 2026-11-24 was a usual day and was MISSED!
      { type: "daily_open", createdAt: "2026-11-23T03:00:00.000Z" }, // Mon 23 hit
      { type: "daily_open", createdAt: "2026-11-18T03:00:00.000Z" }, // Wed 18 hit
      { type: "daily_open", createdAt: "2026-11-17T03:00:00.000Z" }, // Tue 17 hit
      { type: "daily_open", createdAt: "2026-11-16T03:00:00.000Z" }, // Mon 16 hit
      { type: "daily_open", createdAt: "2026-11-10T03:00:00.000Z" }, // Tue 10 hit
    ];

    const habits = detectHabits(events, MOCK_CATEGORIES, baseNow);
    const habit = habits.find((h) => h.key === "clocks-in");
    expect(habit).toBeDefined();
    expect(habit?.doneToday).toBe(true);
    expect(habit?.status).toBe("slipping");
    // Even though done today, streak must be 0 because a past usual day was missed
    expect(habit?.currentStreak).toBe(0);
    // bestStreak preserves past runs
    expect(habit?.bestStreak).toBeGreaterThanOrEqual(1);
  });

  it("5. slipping after today's time window, but streak preserved until midnight", () => {
    // Morning window is 05:00 to 12:00.
    // Window has ended at 14:00 IST (baseNow is 14:00 IST / 08:30 UTC).
    // Today is Wednesday 2026-11-25 (a usual day, hit in prior weeks).
    // Tue 24 and Mon 23 were hit, so streak before today is 2.
    const events: RawActivityEvent[] = [
      { type: "daily_open", createdAt: "2026-11-24T03:00:00.000Z" }, // Tue 24 morning (08:30 IST)
      { type: "daily_open", createdAt: "2026-11-17T03:00:00.000Z" }, // Tue 17 morning
      { type: "daily_open", createdAt: "2026-11-23T03:00:00.000Z" }, // Mon 23 morning
      { type: "daily_open", createdAt: "2026-11-16T03:00:00.000Z" }, // Mon 16 morning
      { type: "daily_open", createdAt: "2026-11-18T03:00:00.000Z" }, // Wed 18 morning (makes Wed a usual day!)
      { type: "daily_open", createdAt: "2026-11-11T03:00:00.000Z" }, // Wed 11 morning
    ];

    // At 14:00 IST (after morning window 12:00):
    const habitsAt14 = detectHabits(events, MOCK_CATEGORIES, baseNow);
    const habit14 = habitsAt14.find((h) => h.key === "clocks-in");
    expect(habit14?.status).toBe("slipping");
    // Streak is preserved until midnight
    expect(habit14?.currentStreak).toBe(6);

    // At 09:00 IST (during morning window):
    const nowAt09 = new Date("2026-11-25T03:30:00.000Z"); // 09:00 IST
    const habitsAt09 = detectHabits(events, MOCK_CATEGORIES, nowAt09);
    const habit09 = habitsAt09.find((h) => h.key === "clocks-in");
    expect(habit09?.status).toBe("on_track");
    expect(habit09?.currentStreak).toBe(6);
  });

  it("6. fading after 14 days (hidden from overview.habits, counted in fadingCount)", () => {
    // Last seen 15 days ago
    const lastSeen = addDays(today, -15);
    const events: RawActivityEvent[] = [
      { type: "boss_finished", createdAt: `${lastSeen}T10:00:00.000Z` },
      { type: "boss_finished", createdAt: `${addDays(lastSeen, -2)}T10:00:00.000Z` },
      { type: "boss_finished", createdAt: `${addDays(lastSeen, -4)}T10:00:00.000Z` },
    ];

    const detected = detectHabits(events, MOCK_CATEGORIES, baseNow);
    const bossHabit = detected.find((h) => h.key === "boss-fights");
    expect(bossHabit).toBeDefined();
    expect(bossHabit?.status).toBe("fading");

    const overview = analyzeHabits(events, MOCK_CATEGORIES, baseNow, DUMMY_COACH_NOTE);
    expect(overview.habits.some((h) => h.key === "boss-fights")).toBe(false);
    expect(overview.fadingCount).toBe(1);

    // getDetail still works for fading habit
    if (bossHabit) {
      const detail = buildHabitDetail(bossHabit, events);
      expect(detail.statusNote).toContain("Not seen for over 2 weeks");
    }
  });

  it("7. weekday-only behaviour not broken by weekends", () => {
    // Habit on weekdays: Friday hit, Monday hit. Weekend (Sat, Sun) should not break the streak.
    // Friday: 2026-11-20
    // Monday: 2026-11-23
    // Tuesday: 2026-11-24
    // Wednesday (today): 2026-11-25 (done today)
    // Make sure Mon..Fri each have >= 2 hits in 28 days so all 5 weekdays are usual days:
    const events: RawActivityEvent[] = [
      { type: "daily_open", createdAt: "2026-11-25T02:00:00.000Z" }, // Wed 25 (today)
      { type: "daily_open", createdAt: "2026-11-24T02:00:00.000Z" }, // Tue 24
      { type: "daily_open", createdAt: "2026-11-23T02:00:00.000Z" }, // Mon 23
      // Sat 21 & Sun 22 have no events (weekend)
      { type: "daily_open", createdAt: "2026-11-20T02:00:00.000Z" }, // Fri 20
      { type: "daily_open", createdAt: "2026-11-19T02:00:00.000Z" }, // Thu 19
      // Previous week hits so all 5 weekdays have >= 2 hits in 28 days
      { type: "daily_open", createdAt: "2026-11-18T02:00:00.000Z" }, // Wed 18
      { type: "daily_open", createdAt: "2026-11-17T02:00:00.000Z" }, // Tue 17
      { type: "daily_open", createdAt: "2026-11-16T02:00:00.000Z" }, // Mon 16
      { type: "daily_open", createdAt: "2026-11-13T02:00:00.000Z" }, // Fri 13
      { type: "daily_open", createdAt: "2026-11-12T02:00:00.000Z" }, // Thu 12
    ];

    const habits = detectHabits(events, MOCK_CATEGORIES, baseNow);
    const habit = habits.find((h) => h.key === "clocks-in");
    expect(habit?.doneToday).toBe(true);
    // Mon, Tue, Wed, Thu, Fri are usual days. Weekends are skipped and do not break streak!
    expect(habit?.currentStreak).toBe(10);
  });

  it("8. IST midnight boundary", () => {
    // In UTC, 18:29:59Z is 23:59:59 IST (same day)
    // 18:30:00Z is 00:00:00 IST (next day)
    const preMidnight = new Date("2026-11-23T18:29:59.000Z");
    const postMidnight = new Date("2026-11-23T18:30:00.000Z");

    expect(toKolkataDate(preMidnight)).toBe("2026-11-23");
    expect(toKolkataHour(preMidnight)).toBe(23);

    expect(toKolkataDate(postMidnight)).toBe("2026-11-24");
    expect(toKolkataHour(postMidnight)).toBe(0);

    // Time window end checks
    const morningWindow = { part: "morning" as const, startHour: 5, endHour: 12 };
    expect(hasWindowEnded(morningWindow, 11)).toBe(false);
    expect(hasWindowEnded(morningWindow, 12)).toBe(true);

    const nightWindow = { part: "night" as const, startHour: 22, endHour: 5 };
    expect(hasWindowEnded(nightWindow, 23)).toBe(false); // In night window
    expect(hasWindowEnded(nightWindow, 2)).toBe(false); // In night window
    expect(hasWindowEnded(nightWindow, 6)).toBe(true); // After night window
  });

  it("9. insight is null with thin data", () => {
    // 4 training events on 3 days (too thin: needs >= 10 events on >= 5 days)
    const thinEvents: RawActivityEvent[] = [
      { type: "training_finished", stars: 3, createdAt: `${today}T12:00:00.000Z` },
      { type: "training_finished", stars: 3, createdAt: `${addDays(today, -1)}T12:00:00.000Z` },
      { type: "training_finished", stars: 2, createdAt: `${addDays(today, -2)}T12:00:00.000Z` },
      { type: "training_finished", stars: 2, createdAt: `${addDays(today, -2)}T13:00:00.000Z` },
    ];

    const insights = computeInsights(thinEvents, [], baseNow);
    expect(insights.bestTimeOfDay).toBeNull();
    expect(insights.mostSkippedWeekday).toBeNull();
    expect(insights.skillLink).toBeNull();
    expect(insights.streakAtRisk).toBeNull();
  });

  it("10. weakest-category suggestion", () => {
    // Weakest category in MOCK_CATEGORIES is "difficult-customers" (mastery 0.2, stars 3)
    const events: RawActivityEvent[] = [
      { type: "training_finished", categoryKey: "handling-complaints", stars: 3, createdAt: `${today}T10:00:00.000Z` },
    ];

    const suggestion = computeNextHabit(events, [], MOCK_CATEGORIES, baseNow);
    expect(suggestion).not.toBeNull();
    expect(suggestion?.categoryKey).toBe("difficult-customers");
    expect(suggestion?.title).toContain("Difficult Customers");
    expect(suggestion?.occurrences).toBe(0);
    expect(suggestion?.progress).toBe(0);

    // If difficult-customers already detected as habit, next weakest should be suggested ("problem-solving", mastery 0.5)
    const detectedHabit = {
      key: "plays-category:difficult-customers",
      kind: "plays-category" as const,
      categoryKey: "difficult-customers" as const,
      title: "Plays Difficult Customers 3x a week",
      description: "",
      icon: "target",
      usualDays: [1, 3, 5],
      usualWindow: null,
      stage: "forming" as const,
      status: "on_track" as const,
      currentStreak: 1,
      bestStreak: 1,
      consistency: 0.5,
      doneToday: false,
      heatmap: [],
      lastSeenAt: baseNow.toISOString(),
    };

    const nextSuggestion = computeNextHabit(events, [detectedHabit], MOCK_CATEGORIES, baseNow);
    expect(nextSuggestion?.categoryKey).toBe("problem-solving");
  });

  it("11. insights when criteria are met (bestTimeOfDay, mostSkippedWeekday, skillLink, streakAtRisk)", () => {
    // History starting 28 days ago to satisfy >= 3 full weeks
    const startDate = addDays(today, -28);
    const events: RawActivityEvent[] = [];

    // Add 12 evening training events across 6 days (Group A for skillLink, evening for bestTimeOfDay)
    // Avg score in evening = 3 stars
    for (let i = 0; i < 6; i++) {
      const d = addDays(startDate, i * 2); // days 0, 2, 4, 6, 8, 10
      events.push(
        { type: "training_finished", stars: 3, createdAt: `${d}T13:00:00.000Z` }, // 18:30 IST (evening)
        { type: "training_finished", stars: 3, createdAt: `${d}T14:00:00.000Z` }, // 19:30 IST (evening)
      );
    }

    // Add 4 morning training events across 4 days (Group B for skillLink)
    // Avg score in morning = 2 stars (lift = (3 - 2) / 2 = 50% >= 5%)
    for (let i = 0; i < 4; i++) {
      const d = addDays(startDate, 13 + i * 2); // days 13, 15, 17, 19
      events.push(
        { type: "training_finished", stars: 2, createdAt: `${d}T03:00:00.000Z` }, // 08:30 IST (morning)
      );
    }

    // Let's add detected habits to test streakAtRisk
    const habitWithStreak = {
      key: "trains",
      kind: "trains" as const,
      categoryKey: null,
      title: "Trains on weekday evenings",
      description: "",
      icon: "book",
      usualDays: [1, 2, 3, 4, 5],
      usualWindow: { part: "evening" as const, startHour: 17, endHour: 22 },
      stage: "building" as const,
      status: "on_track" as const,
      currentStreak: 5,
      bestStreak: 7,
      consistency: 0.8,
      doneToday: false, // Not done today!
      heatmap: [],
      lastSeenAt: addDays(today, -1),
    };

    const insights = computeInsights(events, [habitWithStreak], baseNow);
    expect(insights.bestTimeOfDay).not.toBeNull();
    expect(insights.bestTimeOfDay?.part).toBe("evening");
    expect(insights.bestTimeOfDay?.text).toContain("between 5 and 10 pm");

    expect(insights.skillLink).not.toBeNull();
    expect(insights.skillLink?.liftPercent).toBe(50);
    expect(insights.skillLink?.text).toContain("50% higher");

    expect(insights.streakAtRisk).not.toBeNull();
    expect(insights.streakAtRisk?.habitKey).toBe("trains");
    expect(insights.streakAtRisk?.text).toContain("Trains on weekday evenings");
  });

  it("12. habit forgotten after 56 days without it", () => {
    // 3 events 60 days ago
    const ancientDate = addDays(today, -60);
    const ancientEvents: RawActivityEvent[] = [
      { type: "training_finished", createdAt: `${ancientDate}T09:00:00.000Z` },
      { type: "training_finished", createdAt: `${addDays(ancientDate, -1)}T09:00:00.000Z` },
      { type: "training_finished", createdAt: `${addDays(ancientDate, -2)}T09:00:00.000Z` },
    ];

    const habits = detectHabits(ancientEvents, MOCK_CATEGORIES, baseNow);
    expect(habits).toEqual([]); // Completely forgotten
  });
});
