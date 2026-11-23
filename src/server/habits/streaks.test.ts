import { describe, expect, it } from "vitest";
import { computeHabitStreaks } from "./streaks";

describe("Habit streak calculation", () => {
  const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
  const WEEKDAYS = [1, 2, 3, 4, 5];

  describe("empty history", () => {
    it("returns 0 currentStreak and 0 bestStreak when logs are empty", () => {
      const result = computeHabitStreaks([], ALL_DAYS, "2026-11-23");
      expect(result).toEqual({ currentStreak: 0, bestStreak: 0 });
    });
  });

  describe("same-day double check-in", () => {
    it("counts duplicate logs on the same day only once", () => {
      const logs = ["2026-11-23", "2026-11-23", "2026-11-23"];
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-11-23");
      expect(result).toEqual({ currentStreak: 1, bestStreak: 1 });
    });

    it("handles multiple check-ins across multiple days without inflating streaks", () => {
      const logs = [
        "2026-11-20",
        "2026-11-20",
        "2026-11-21",
        "2026-11-22",
        "2026-11-22",
        "2026-11-23",
      ];
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-11-23");
      expect(result).toEqual({ currentStreak: 4, bestStreak: 4 });
    });
  });

  describe("daily habit", () => {
    it("calculates active streak when checked in today", () => {
      const logs = ["2026-11-21", "2026-11-22", "2026-11-23"];
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-11-23");
      expect(result).toEqual({ currentStreak: 3, bestStreak: 3 });
    });

    it("keeps streak alive when yesterday was checked in but today has not been checked in yet", () => {
      const logs = ["2026-11-20", "2026-11-21", "2026-11-22"];
      // Today is 2026-11-23 (morning, not checked in yet)
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-11-23");
      expect(result).toEqual({ currentStreak: 3, bestStreak: 3 });
    });

    it("resets currentStreak to 0 when a scheduled day was skipped", () => {
      // Checked in on 20th, 21st, 22nd. Today is 24th (23rd was skipped).
      const logs = ["2026-11-20", "2026-11-21", "2026-11-22"];
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-11-24");
      expect(result).toEqual({ currentStreak: 0, bestStreak: 3 });
    });
  });

  describe("weekday-only habit skipping weekends", () => {
    it("keeps streak alive across Saturday and Sunday without breaking", () => {
      // 2026-11-19 is Thursday, 2026-11-20 is Friday.
      // 2026-11-21 is Saturday, 2026-11-22 is Sunday.
      // 2026-11-23 is Monday.
      const logs = ["2026-11-19", "2026-11-20"];

      // Checked on Saturday: weekends not scheduled -> alive
      const sat = computeHabitStreaks(logs, WEEKDAYS, "2026-11-21");
      expect(sat).toEqual({ currentStreak: 2, bestStreak: 2 });

      // Checked on Sunday: weekends not scheduled -> alive
      const sun = computeHabitStreaks(logs, WEEKDAYS, "2026-11-22");
      expect(sun).toEqual({ currentStreak: 2, bestStreak: 2 });

      // Checked on Monday morning before check-in -> alive
      const monMorning = computeHabitStreaks(logs, WEEKDAYS, "2026-11-23");
      expect(monMorning).toEqual({ currentStreak: 2, bestStreak: 2 });

      // Checked in on Monday -> continues streak to 3
      const monCheckedIn = computeHabitStreaks([...logs, "2026-11-23"], WEEKDAYS, "2026-11-23");
      expect(monCheckedIn).toEqual({ currentStreak: 3, bestStreak: 3 });
    });

    it("resets currentStreak to 0 on Tuesday if Monday was skipped", () => {
      // Last checked in on Friday 2026-11-20.
      // Monday 2026-11-23 was scheduled but skipped.
      // Today is Tuesday 2026-11-24.
      const logs = ["2026-11-19", "2026-11-20"];
      const result = computeHabitStreaks(logs, WEEKDAYS, "2026-11-24");
      expect(result).toEqual({ currentStreak: 0, bestStreak: 2 });
    });
  });

  describe("gap resets", () => {
    it("resets and tracks previous best streak when a gap occurs in history", () => {
      // First streak: 3 days (1st, 2nd, 3rd)
      // Gap: 4th, 5th, 6th missed
      // Second streak: 2 days (7th, 8th)
      const logs = [
        "2026-11-01",
        "2026-11-02",
        "2026-11-03",
        "2026-11-07",
        "2026-11-08",
      ];
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-11-08");
      expect(result).toEqual({ currentStreak: 2, bestStreak: 3 });
    });

    it("handles multiple gaps and identifies highest historical streak", () => {
      const logs = [
        "2026-10-01", // 1
        "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", // 4
        "2026-10-15", "2026-10-16", // 2
        "2026-10-25", // 1
      ];
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-10-25");
      expect(result).toEqual({ currentStreak: 1, bestStreak: 4 });
    });
  });

  describe("date format flexibility", () => {
    it("accepts Date instances as well as string dates", () => {
      const logs = [
        new Date("2026-11-21T00:00:00.000Z"),
        new Date("2026-11-22T00:00:00.000Z"),
        new Date("2026-11-23T00:00:00.000Z"),
      ];
      const result = computeHabitStreaks(logs, ALL_DAYS, "2026-11-23");
      expect(result).toEqual({ currentStreak: 3, bestStreak: 3 });
    });
  });
});
