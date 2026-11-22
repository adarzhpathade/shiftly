import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  guidedXp,
  isoWeekday,
  levelForXp,
  progressToNextLevel,
  replayXp,
  starsForScore,
  streakAfterCheckIn,
  streakMilestone,
  toISODate,
  xpForLevel,
} from "./gamification";

describe("xpForLevel / levelForXp", () => {
  it("follows 250 * (L-1) * L / 2", () => {
    expect([1, 2, 3, 4, 5, 6].map(xpForLevel)).toEqual([0, 250, 750, 1500, 2500, 3750]);
  });
  it("treats levels below 1 as level 1", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-3)).toBe(0);
  });
  it("maps xp to level at every boundary", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(249)).toBe(1);
    expect(levelForXp(250)).toBe(2);
    expect(levelForXp(749)).toBe(2);
    expect(levelForXp(750)).toBe(3);
    expect(levelForXp(2500)).toBe(5);
    expect(levelForXp(-50)).toBe(1);
  });
  it("is consistent with xpForLevel for many levels", () => {
    for (let l = 1; l <= 60; l++) {
      expect(levelForXp(xpForLevel(l))).toBe(l);
      expect(levelForXp(xpForLevel(l + 1) - 1)).toBe(l);
    }
  });
});

describe("progressToNextLevel", () => {
  it("reports a fresh user", () => {
    expect(progressToNextLevel(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNext: 250, xpToNext: 250, fraction: 0 });
  });
  it("reports mid-level progress", () => {
    const p = progressToNextLevel(500);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(250);
    expect(p.xpForNext).toBe(500);
    expect(p.xpToNext).toBe(250);
    expect(p.fraction).toBe(0.5);
  });
  it("resets the bar exactly on a level boundary", () => {
    const p = progressToNextLevel(750);
    expect(p.level).toBe(3);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.fraction).toBe(0);
  });
});

describe("starsForScore", () => {
  it("awards 3 / 2 / 1 stars by percentage", () => {
    expect(starsForScore(9, 10)).toBe(3);
    expect(starsForScore(10, 10)).toBe(3);
    expect(starsForScore(8.9, 10)).toBe(2);
    expect(starsForScore(6, 10)).toBe(2);
    expect(starsForScore(5.9, 10)).toBe(1);
    expect(starsForScore(0, 10)).toBe(1);
  });
  it("gives 0 stars when not completed", () => {
    expect(starsForScore(10, 10, false)).toBe(0);
  });
  it("handles a zero max safely", () => {
    expect(starsForScore(0, 0)).toBe(1);
  });
});

describe("guidedXp / replayXp", () => {
  it("scales the reward by stars", () => {
    expect(guidedXp(0, 40)).toBe(0);
    expect(guidedXp(1, 40)).toBe(20);
    expect(guidedXp(2, 40)).toBe(30);
    expect(guidedXp(3, 40)).toBe(40);
  });
  it("pays a first completion in full for its stars", () => {
    expect(replayXp(0, 2, 40)).toBe(30);
  });
  it("pays only the improvement on replays", () => {
    expect(replayXp(1, 3, 40)).toBe(20);
    expect(replayXp(2, 3, 40)).toBe(10);
  });
  it("pays nothing for equal or worse replays", () => {
    expect(replayXp(3, 3, 40)).toBe(0);
    expect(replayXp(3, 1, 40)).toBe(0);
  });
});

describe("dates", () => {
  it("computes day differences across month and year ends", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
    expect(daysBetween("2026-03-10", "2026-03-10")).toBe(0);
    expect(daysBetween("2026-03-10", "2026-03-07")).toBe(-3);
  });
  it("adds days and formats", () => {
    expect(addDays("2026-02-27", 2)).toBe("2026-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(toISODate(new Date(2026, 10, 5))).toBe("2026-11-05");
  });
});

describe("streakAfterCheckIn", () => {
  it("starts a streak on the first ever check-in", () => {
    expect(streakAfterCheckIn(null, "2026-11-22", 0)).toEqual({ streak: 1, status: "first" });
  });
  it("does not double count the same day", () => {
    expect(streakAfterCheckIn("2026-11-22", "2026-11-22", 4)).toEqual({ streak: 4, status: "same-day" });
  });
  it("extends on consecutive days", () => {
    expect(streakAfterCheckIn("2026-11-21", "2026-11-22", 6)).toEqual({ streak: 7, status: "continued" });
    expect(streakAfterCheckIn("2026-11-30", "2026-12-01", 2)).toEqual({ streak: 3, status: "continued" });
  });
  it("resets after a gap", () => {
    expect(streakAfterCheckIn("2026-11-19", "2026-11-22", 9)).toEqual({ streak: 1, status: "reset" });
  });
  it("never drops a same-day streak below 1", () => {
    expect(streakAfterCheckIn("2026-11-22", "2026-11-22", 0).streak).toBe(1);
  });
});

describe("streakAfterCheckIn with a schedule", () => {
  // 2026-11-22 is a Sunday (7); Mon 11-16, Wed 11-18, Fri 11-20.
  const mwf = [1, 3, 5];
  it("computes ISO weekdays", () => {
    expect(isoWeekday("2026-11-22")).toBe(7);
    expect(isoWeekday("2026-11-16")).toBe(1);
  });
  it("continues across unscheduled days", () => {
    expect(streakAfterCheckIn("2026-11-16", "2026-11-18", 3, mwf)).toEqual({ streak: 4, status: "continued" });
    expect(streakAfterCheckIn("2026-11-20", "2026-11-23", 1, mwf)).toEqual({ streak: 2, status: "continued" });
  });
  it("resets when a scheduled day was missed", () => {
    expect(streakAfterCheckIn("2026-11-16", "2026-11-20", 3, mwf)).toEqual({ streak: 1, status: "reset" });
  });
  it("still handles same day and first check-in", () => {
    expect(streakAfterCheckIn("2026-11-18", "2026-11-18", 3, mwf).status).toBe("same-day");
    expect(streakAfterCheckIn(null, "2026-11-18", 0, mwf).status).toBe("first");
  });
  it("treats a full week schedule like no schedule", () => {
    expect(streakAfterCheckIn("2026-11-19", "2026-11-22", 5, [1, 2, 3, 4, 5, 6, 7]).status).toBe("reset");
  });
});

describe("streakMilestone", () => {
  it("detects 7, 30 and 100 only", () => {
    expect(streakMilestone(7)).toBe(7);
    expect(streakMilestone(30)).toBe(30);
    expect(streakMilestone(100)).toBe(100);
    expect(streakMilestone(8)).toBeUndefined();
  });
});
