import { describe, expect, it } from "vitest";
import { activeDays, gridLayout, heatLevel, isoWeekday } from "./heatmap-layout";

describe("heatmap-layout", () => {
  it("finds the ISO weekday", () => {
    expect(isoWeekday("2026-11-23")).toBe(1);
    expect(isoWeekday("2026-11-29")).toBe(7);
  });

  it("buckets counts into levels", () => {
    expect([0, 1, 2, 3, 9].map(heatLevel)).toEqual([0, 1, 2, 3, 3]);
  });

  it("pads the first week so cells sit on their weekday row", () => {
    const cells = ["2026-11-25", "2026-11-26", "2026-11-27"].map((date) => ({ date, count: 1 })); // Wed to Fri
    const { slots, columns } = gridLayout(cells);
    expect(columns).toBe(1);
    expect(slots).toHaveLength(7);
    expect(slots.slice(0, 2)).toEqual([null, null]);
    expect(slots[2]?.date).toBe("2026-11-25");
  });

  it("counts active days", () => {
    expect(activeDays([{ date: "2026-11-23", count: 0 }, { date: "2026-11-24", count: 2 }])).toBe(1);
  });
});
