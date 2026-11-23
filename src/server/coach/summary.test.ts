// @vitest-environment node
import { describe, expect, it } from "vitest";
import { summarizeActivity, type SummaryActivityEvent } from "./summary";

describe("summarizeActivity", () => {
  const referenceDate = new Date("2026-11-23T12:00:00+05:30"); // Monday noon Kolkata time

  it("returns zero/empty stats when there are no events", () => {
    const summary = summarizeActivity([], referenceDate);

    expect(summary.daysActive).toBe(0);
    expect(summary.totalScenariosFinished).toBe(0);
    expect(summary.scenariosFinishedPerCategory).toEqual({});
    expect(summary.averageStars).toBeNull();
    expect(summary.bossCallsWon).toBe(0);
    expect(summary.bossCallsLost).toBe(0);
    expect(summary.perfectScores).toBe(0);
    expect(summary.questsCompleted).toBe(0);
    expect(summary.mostActiveDayPart).toBeNull();
    expect(summary.changeVsLastWeek).toEqual({ daysActive: 0, scenariosFinished: 0 });
    expect(summary.weakestCategory).toBeNull();
  });

  it("calculates active days, categories, average stars and perfect scores correctly", () => {
    const events: SummaryActivityEvent[] = [
      // Day 0 (today: 2026-11-23) - 2 scenarios (morning 09:00, evening 18:00)
      {
        type: "training_finished",
        categoryKey: "handling-complaints",
        stars: 3,
        createdAt: "2026-11-23T09:00:00+05:30",
      },
      {
        type: "perfect_score",
        categoryKey: "handling-complaints",
        createdAt: "2026-11-23T09:00:00+05:30",
      },
      {
        type: "training_finished",
        categoryKey: "difficult-customers",
        stars: 2,
        createdAt: "2026-11-23T18:00:00+05:30",
      },
      // Day 1 (yesterday: 2026-11-22) - 1 scenario (afternoon 14:00)
      {
        type: "training_finished",
        categoryKey: "handling-complaints",
        stars: 3,
        createdAt: "2026-11-22T14:00:00+05:30",
      },
      // Day 3 (2026-11-20) - 1 scenario, 1 quest (morning 08:30)
      {
        type: "training_finished",
        categoryKey: "difficult-customers",
        stars: 1,
        createdAt: "2026-11-20T08:30:00+05:30",
      },
      {
        type: "quest_completed",
        meta: { questId: "quest-1" },
        createdAt: "2026-11-20T08:35:00+05:30",
      },
      // Day 5 (2026-11-18) - 1 boss won (evening 19:00)
      {
        type: "boss_finished",
        categoryKey: "difficult-customers",
        meta: { won: true },
        stars: 3,
        createdAt: "2026-11-18T19:00:00+05:30",
      },
      // Day 6 (2026-11-17) - 1 boss lost (night 23:00)
      {
        type: "boss_finished",
        categoryKey: "problem-solving",
        meta: { won: false },
        stars: 1,
        createdAt: "2026-11-17T23:00:00+05:30",
      },
    ];

    const summary = summarizeActivity(events, referenceDate);

    // Active days: Nov 23, Nov 22, Nov 20, Nov 18, Nov 17 -> 5 days
    expect(summary.daysActive).toBe(5);

    // Scenarios: handling-complaints (2), difficult-customers (2)
    expect(summary.totalScenariosFinished).toBe(4);
    expect(summary.scenariosFinishedPerCategory).toEqual({
      "handling-complaints": 2,
      "difficult-customers": 2,
    });

    // Average stars: (3 + 2 + 3 + 1) / 4 = 9 / 4 = 2.25 -> rounded to 2.3
    expect(summary.averageStars).toBe(2.3);

    // Boss calls
    expect(summary.bossCallsWon).toBe(1);
    expect(summary.bossCallsLost).toBe(1);

    // Perfect scores: 1 explicit perfect_score event + 1 training with 3 stars = 1 explicit
    expect(summary.perfectScores).toBe(1);

    // Quests
    expect(summary.questsCompleted).toBe(1);

    // Weakest category: difficult-customers avg is (2+1)/2 = 1.5; handling-complaints is 3.0
    expect(summary.weakestCategory).toBe("difficult-customers");
  });

  it("calculates change vs previous week correctly", () => {
    const events: SummaryActivityEvent[] = [
      // Current week (last 7 days): 2 scenarios, 2 days active
      {
        type: "training_finished",
        categoryKey: "customer-queries",
        stars: 3,
        createdAt: "2026-11-23T10:00:00+05:30",
      },
      {
        type: "training_finished",
        categoryKey: "customer-queries",
        stars: 3,
        createdAt: "2026-11-22T10:00:00+05:30",
      },
      // Previous week (days 7-13 ago): 4 scenarios, 3 days active
      {
        type: "training_finished",
        categoryKey: "customer-queries",
        stars: 3,
        createdAt: "2026-11-15T10:00:00+05:30", // 8 days ago
      },
      {
        type: "training_finished",
        categoryKey: "customer-queries",
        stars: 2,
        createdAt: "2026-11-15T11:00:00+05:30", // 8 days ago
      },
      {
        type: "training_finished",
        categoryKey: "customer-queries",
        stars: 2,
        createdAt: "2026-11-13T10:00:00+05:30", // 10 days ago
      },
      {
        type: "training_finished",
        categoryKey: "customer-queries",
        stars: 2,
        createdAt: "2026-11-11T10:00:00+05:30", // 12 days ago
      },
      // Older than 14 days: should be ignored
      {
        type: "training_finished",
        categoryKey: "customer-queries",
        stars: 3,
        createdAt: "2026-11-05T10:00:00+05:30", // 18 days ago
      },
    ];

    const summary = summarizeActivity(events, referenceDate);

    expect(summary.daysActive).toBe(2);
    expect(summary.totalScenariosFinished).toBe(2);
    // Change vs last week: curr 2 - prev 4 = -2 scenarios; curr 2 - prev 3 = -1 daysActive
    expect(summary.changeVsLastWeek).toEqual({
      daysActive: -1,
      scenariosFinished: -2,
    });
  });

  it("determines most active day part in Asia/Kolkata timezone", () => {
    const events: SummaryActivityEvent[] = [
      // Morning (05:00 - 12:00) Kolkata
      { type: "daily_open", createdAt: "2026-11-23T06:30:00+05:30" },
      // Afternoon (12:00 - 17:00) Kolkata: 3 events
      { type: "training_finished", categoryKey: "problem-solving", stars: 2, createdAt: "2026-11-23T13:00:00+05:30" },
      { type: "training_finished", categoryKey: "problem-solving", stars: 3, createdAt: "2026-11-22T14:00:00+05:30" },
      { type: "quest_completed", createdAt: "2026-11-21T15:30:00+05:30" },
      // Evening (17:00 - 22:00) Kolkata: 1 event
      { type: "boss_finished", meta: { won: true }, createdAt: "2026-11-20T18:00:00+05:30" },
    ];

    const summary = summarizeActivity(events, referenceDate);

    expect(summary.mostActiveDayPart).toBe("afternoon");
  });
});
