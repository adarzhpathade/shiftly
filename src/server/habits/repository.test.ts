import { describe, expect, it, vi, beforeAll } from "vitest";

vi.mock("server-only", () => ({}));

import { realHabitRepo } from "./repository";

describe("realHabitRepo integration", () => {
  beforeAll(async () => {
    // Ensure .env is loaded if DATABASE_URL is not present in process.env
    if (!process.env.DATABASE_URL) {
      try {
        const dotenv = await import("dotenv");
        dotenv.config();
      } catch {}
    }
  });

  it("lists templates from the database", async () => {
    const templates = await realHabitRepo.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(6);
    expect(templates.some((t) => t.key === "punctuality")).toBe(true);
  });

  it("creates, checks in (idempotent), details, updates and removes a habit for a seeded employee", async () => {
    const employeeId = "user-emp-aarohi";
    const uniqueTitle = `Test Habit ${Date.now()}`;

    // 1. Create habit
    const created = await realHabitRepo.create(employeeId, {
      title: uniqueTitle,
      icon: "clock",
      frequency: "daily",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      reminderTime: "09:00",
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe(uniqueTitle);
    expect(created.currentStreak).toBe(0);
    expect(created.doneToday).toBe(false);

    // 2. Check in first time today -> awards 10 XP
    const firstCheckIn = await realHabitRepo.checkIn(employeeId, created.id, "Morning checkin");
    expect(firstCheckIn.xpEarned).toBe(10);
    expect(firstCheckIn.streak).toBeGreaterThanOrEqual(1);
    expect(firstCheckIn.habit.doneToday).toBe(true);

    // 3. Check in second time today -> idempotent: awards 0 XP
    const secondCheckIn = await realHabitRepo.checkIn(employeeId, created.id, "Second checkin");
    expect(secondCheckIn.xpEarned).toBe(0);
    expect(secondCheckIn.streak).toBe(firstCheckIn.streak);
    expect(secondCheckIn.habit.doneToday).toBe(true);

    // 4. Get habit detail
    const detail = await realHabitRepo.getDetail(employeeId, created.id);
    expect(detail.id).toBe(created.id);
    expect(detail.heatmap.length).toBe(84);
    expect(detail.notes.some((n) => n.text === "Morning checkin")).toBe(true);

    // 5. Update habit
    const updated = await realHabitRepo.update(employeeId, created.id, {
      title: `${uniqueTitle} Updated`,
    });
    expect(updated.title).toBe(`${uniqueTitle} Updated`);

    // 6. Remove habit
    await realHabitRepo.remove(employeeId, created.id);

    // 7. Verify removed
    const list = await realHabitRepo.listToday(employeeId);
    expect(list.some((h) => h.id === created.id)).toBe(false);
  });

  it("throws not found when operating on a non-existent habit", async () => {
    await expect(
      realHabitRepo.update("user-emp-aarohi", "non-existent-habit-id", { title: "New" }),
    ).rejects.toThrow(/not found/i);

    await expect(
      realHabitRepo.remove("user-emp-aarohi", "non-existent-habit-id"),
    ).rejects.toThrow(/not found/i);

    await expect(
      realHabitRepo.checkIn("user-emp-aarohi", "non-existent-habit-id"),
    ).rejects.toThrow(/not found/i);

    await expect(
      realHabitRepo.getDetail("user-emp-aarohi", "non-existent-habit-id"),
    ).rejects.toThrow(/not found/i);
  });
});
