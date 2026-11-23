import { describe, expect, it } from "vitest";
import { formatDays, formatHour, formatShortDate, formatWindow, slippingNudge, streakText } from "./format";

describe("habit format helpers", () => {
  it("formats usual days", () => {
    expect(formatDays([1, 3, 5])).toBe("Mon, Wed, Fri");
    expect(formatDays([5, 4, 3, 2, 1])).toBe("Weekdays");
    expect(formatDays([6, 7])).toBe("Weekends");
    expect(formatDays([1, 2, 3, 4, 5, 6, 7])).toBe("Every day");
    expect(formatDays([])).toBe("No fixed days");
  });

  it("formats hours and windows", () => {
    expect(formatHour(0)).toBe("12 am");
    expect(formatHour(12)).toBe("12 pm");
    expect(formatHour(17)).toBe("5 pm");
    expect(formatWindow({ part: "evening", startHour: 17, endHour: 22 })).toBe("Evenings, 5 to 10 pm");
    expect(formatWindow({ part: "morning", startHour: 5, endHour: 12 })).toBe("Mornings, 5 am to 12 pm");
    expect(formatWindow(null)).toBe("Any time");
  });

  it("writes a gentle slipping nudge", () => {
    expect(slippingNudge({ currentStreak: 4, usualWindow: { part: "evening", startHour: 17, endHour: 22 } })).toContain(
      "4-day streak",
    );
    expect(slippingNudge({ currentStreak: 0, usualWindow: null })).toContain("back on track");
  });

  it("pluralises streaks and formats dates", () => {
    expect(streakText(1)).toBe("1 day streak");
    expect(streakText(5)).toBe("5 day streak");
    expect(formatShortDate("2026-11-17")).toBe("17 Nov");
  });
});
