import { describe, expect, it } from "vitest";
import { habitInputSchema, parseHabitForm } from "./validation";

describe("Habit form validation", () => {
  function makeFormData(data: {
    title?: string;
    icon?: string;
    days?: (string | number)[];
    reminderTime?: string;
  }): FormData {
    const fd = new FormData();
    if (data.title !== undefined) fd.set("title", data.title);
    if (data.icon !== undefined) fd.set("icon", data.icon);
    if (data.days !== undefined) {
      for (const d of data.days) {
        fd.append("days", String(d));
      }
    }
    if (data.reminderTime !== undefined) fd.set("reminderTime", data.reminderTime);
    return fd;
  }

  it("accepts valid daily habit (all 7 days -> daily)", () => {
    const fd = makeFormData({
      title: "Daily Meditation",
      icon: "lotus",
      days: ["1", "2", "3", "4", "5", "6", "7"],
      reminderTime: "07:30",
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.title).toBe("Daily Meditation");
      expect(result.input.icon).toBe("lotus");
      expect(result.input.frequency).toBe("daily");
      expect(result.input.daysOfWeek).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(result.input.reminderTime).toBe("07:30");
    }
  });

  it("accepts valid weekly habit (days 2,4 -> weekly)", () => {
    const fd = makeFormData({
      title: "Team Gym",
      icon: "dumbbell",
      days: [2, 4],
      reminderTime: "",
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.title).toBe("Team Gym");
      expect(result.input.icon).toBe("dumbbell");
      expect(result.input.frequency).toBe("weekly");
      expect(result.input.daysOfWeek).toEqual([2, 4]);
      expect(result.input.reminderTime).toBeNull();
    }
  });

  it("rejects empty title with 'Give your habit a name'", () => {
    const fdEmpty = makeFormData({
      title: "",
      icon: "check",
      days: [1],
    });
    const resEmpty = parseHabitForm(fdEmpty);
    expect(resEmpty.ok).toBe(false);
    if (!resEmpty.ok) {
      expect(resEmpty.fieldErrors.title).toBe("Give your habit a name");
    }

    const fdWhitespace = makeFormData({
      title: "     ",
      icon: "check",
      days: [1],
    });
    const resWhitespace = parseHabitForm(fdWhitespace);
    expect(resWhitespace.ok).toBe(false);
    if (!resWhitespace.ok) {
      expect(resWhitespace.fieldErrors.title).toBe("Give your habit a name");
    }
  });

  it("rejects 61-char title with 'Keep it under 60 characters'", () => {
    const fd = makeFormData({
      title: "a".repeat(61),
      icon: "check",
      days: [1],
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.title).toBe("Keep it under 60 characters");
    }
  });

  it("rejects when no days are picked with 'Pick at least one day'", () => {
    const fd = makeFormData({
      title: "Hydrate",
      icon: "water",
      days: [],
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.days).toBe("Pick at least one day");
    }
  });

  it("rejects day 8 with 'Pick at least one day'", () => {
    const fd = makeFormData({
      title: "Hydrate",
      icon: "water",
      days: ["8"],
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.days).toBe("Pick at least one day");
    }
  });

  it("dedupes and sorts duplicate days ascending", () => {
    const fd = makeFormData({
      title: "Hydrate",
      icon: "water",
      days: ["5", "2", "5", "1", "2"],
      reminderTime: "12:00",
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.daysOfWeek).toEqual([1, 2, 5]);
      expect(result.input.frequency).toBe("weekly");
    }
  });

  it("rejects bad time '25:00' with 'Use a time like 08:30'", () => {
    const fd = makeFormData({
      title: "Hydrate",
      icon: "water",
      days: [1],
      reminderTime: "25:00",
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.reminderTime).toBe("Use a time like 08:30");
    }
  });

  it("converts empty time to null", () => {
    const fd = makeFormData({
      title: "Hydrate",
      icon: "water",
      days: [1],
      reminderTime: "",
    });
    const result = parseHabitForm(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.reminderTime).toBeNull();
    }
  });

  it("rejects missing icon with 'Pick an icon'", () => {
    const fdMissing = makeFormData({
      title: "Hydrate",
      days: [1],
    });
    const resMissing = parseHabitForm(fdMissing);
    expect(resMissing.ok).toBe(false);
    if (!resMissing.ok) {
      expect(resMissing.fieldErrors.icon).toBe("Pick an icon");
    }

    const fdInvalid = makeFormData({
      title: "Hydrate",
      icon: "CHECK_INVALID!",
      days: [1],
    });
    const resInvalid = parseHabitForm(fdInvalid);
    expect(resInvalid.ok).toBe(false);
    if (!resInvalid.ok) {
      expect(resInvalid.fieldErrors.icon).toBe("Pick an icon");
    }
  });

  it("works directly via habitInputSchema.safeParse", () => {
    const parsed = habitInputSchema.safeParse({
      title: "  Jogging  ",
      icon: "run",
      days: [1, 2, 3, 4, 5, 6, 7],
      reminderTime: "06:45",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Jogging");
      expect(parsed.data.frequency).toBe("daily");
      expect(parsed.data.daysOfWeek).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(parsed.data.reminderTime).toBe("06:45");
    }
  });
});
