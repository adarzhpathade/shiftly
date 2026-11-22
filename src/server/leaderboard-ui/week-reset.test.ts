import { describe, expect, it } from "vitest";
import { formatResetIn, msUntilWeekReset } from "./week-reset";

describe("week-reset helpers", () => {
  describe("msUntilWeekReset", () => {
    it("returns 1 minute on Sunday 23:59 IST", () => {
      // 2026-11-22 23:59:00 IST is 2026-11-22 18:29:00 UTC
      const sundayNight = new Date("2026-11-22T18:29:00.000Z");
      expect(msUntilWeekReset(sundayNight)).toBe(60_000);
    });

    it("returns 7 days on Monday 00:00 IST", () => {
      // 2026-11-23 00:00:00 IST is 2026-11-22 18:30:00 UTC
      const mondayMidnight = new Date("2026-11-22T18:30:00.000Z");
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(msUntilWeekReset(mondayMidnight)).toBe(sevenDaysMs);
    });

    it("calculates correctly on Wednesday midday (12:00 IST)", () => {
      // 2026-11-25 12:00:00 IST is 2026-11-25 06:30:00 UTC
      // Wednesday 12:00 to Monday 00:00 is 4.5 days = 108 hours
      const wednesdayMidday = new Date("2026-11-25T06:30:00.000Z");
      const expectedMs = 108 * 60 * 60 * 1000;
      expect(msUntilWeekReset(wednesdayMidday)).toBe(expectedMs);
    });

    it("calculates correctly on other days (Thursday, Friday, Saturday)", () => {
      // Thursday 00:00 IST: 4 days to next Monday
      const thursdayMidnight = new Date("2026-11-25T18:30:00.000Z");
      expect(msUntilWeekReset(thursdayMidnight)).toBe(4 * 24 * 60 * 60 * 1000);

      // Saturday 18:00 IST: 1 day + 6 hours = 30 hours to next Monday
      const saturdayEvening = new Date("2026-11-28T12:30:00.000Z");
      expect(msUntilWeekReset(saturdayEvening)).toBe(30 * 60 * 60 * 1000);
    });
  });

  describe("formatResetIn", () => {
    it("formats under 1 minute as 'less than a minute'", () => {
      expect(formatResetIn(0)).toBe("less than a minute");
      expect(formatResetIn(1_000)).toBe("less than a minute");
      expect(formatResetIn(30_000)).toBe("less than a minute");
      expect(formatResetIn(59_999)).toBe("less than a minute");
      expect(formatResetIn(-500)).toBe("less than a minute");
    });

    it("formats under 1 hour as '<minutes>m'", () => {
      expect(formatResetIn(60_000)).toBe("1m");
      expect(formatResetIn(42 * 60_000)).toBe("42m");
      expect(formatResetIn(42 * 60_000 + 45_000)).toBe("42m");
      expect(formatResetIn(59 * 60_000 + 59_000)).toBe("59m");
    });

    it("formats under 1 day as '<hours>h <minutes>m'", () => {
      expect(formatResetIn(60 * 60_000)).toBe("1h 0m");
      expect(formatResetIn((5 * 60 + 20) * 60_000)).toBe("5h 20m");
      expect(formatResetIn((23 * 60 + 59) * 60_000)).toBe("23h 59m");
    });

    it("formats 1 day or more as '<days>d <hours>h'", () => {
      expect(formatResetIn(24 * 60 * 60_000)).toBe("1d 0h");
      expect(formatResetIn((2 * 24 + 4) * 60 * 60_000)).toBe("2d 4h");
      expect(formatResetIn((2 * 24 + 4) * 60 * 60_000 + 35 * 60_000)).toBe("2d 4h");
      expect(formatResetIn(7 * 24 * 60 * 60_000)).toBe("7d 0h");
    });

    it("formats reset time for Sunday 23:59 IST, Wednesday midday, and Monday 00:00 IST", () => {
      const sundayNight = new Date("2026-11-22T18:29:00.000Z");
      expect(formatResetIn(msUntilWeekReset(sundayNight))).toBe("1m");

      const mondayMidnight = new Date("2026-11-22T18:30:00.000Z");
      expect(formatResetIn(msUntilWeekReset(mondayMidnight))).toBe("7d 0h");

      const wednesdayMidday = new Date("2026-11-25T06:30:00.000Z");
      expect(formatResetIn(msUntilWeekReset(wednesdayMidday))).toBe("4d 12h");
    });
  });
});
