import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { addDays } from "@/lib/gamification";
import { todayISO } from "@/lib/time";
import { realHabitRepo } from "./repository";

async function getDb() {
  if (!process.env.DATABASE_URL) {
    try {
      const dotenv = await import("dotenv");
      dotenv.config();
    } catch {}
  }
  const { db } = await import("@/server/db");
  return db;
}

describe("realHabitRepo integration", () => {
  const testUserId = `test-user-habits-${Date.now()}`;
  let categoryId: string | null = null;

  beforeAll(async () => {
    const db = await getDb();

    // 1. Get or find a team
    let team = await db.team.findFirst();
    if (!team) {
      team = await db.team.create({
        data: { name: "Test Team" },
      });
    }

    // 2. Create temporary user
    await db.user.create({
      data: {
        id: testUserId,
        email: `${testUserId}@example.com`,
        name: "Test Habit User",
        passwordHash: "hash123456",
        role: "EMPLOYEE",
        avatarKey: "fox",
        teamId: team.id,
      },
    });

    // 3. Find a category for activity events
    const category = await db.category.findFirst();
    if (category) {
      categoryId = category.id;
    }
  });

  afterAll(async () => {
    const db = await getDb();
    // Clean up temporary user and related data
    try {
      await db.habitStageAward.deleteMany({ where: { userId: testUserId } });
      await db.coachNote.deleteMany({ where: { userId: testUserId } });
      await db.activityEvent.deleteMany({ where: { userId: testUserId } });
      await db.xpEvent.deleteMany({ where: { userId: testUserId } });
      await db.user.delete({ where: { id: testUserId } });
    } catch {
      // Ignore cleanup error if already removed
    }
  });

  it("throws error when user is unknown (never falls back to another user)", async () => {
    const unknownId = "user-unknown-does-not-exist";
    await expect(realHabitRepo.getOverview(unknownId)).rejects.toThrow(/User not found/);
    await expect(realHabitRepo.getDetail(unknownId, "trains")).rejects.toThrow(/User not found/);
    await expect(realHabitRepo.getCoachNote(unknownId)).rejects.toThrow(/User not found/);
  });

  it("returns new-user overview when user has no activity events yet", async () => {
    const overview = await realHabitRepo.getOverview(testUserId);
    expect(overview.habits).toEqual([]);
    expect(overview.fadingCount).toBe(0);
    expect(overview.firstHabits).not.toBeNull();
    expect(overview.firstHabits?.progress).toBe(0);
    expect(overview.coachNote.lines.length).toBe(3);
  });

  it("detects habits, awards stage-up XP once, and computes details after inserting sample activity", async () => {
    const db = await getDb();
    const today = todayISO(new Date());

    // Insert 3 training_finished events on distinct days within the last 14 days
    const dates = [today, addDays(today, -2), addDays(today, -4)];
    for (const d of dates) {
      await db.activityEvent.create({
        data: {
          userId: testUserId,
          type: "TRAINING_FINISHED",
          categoryId,
          stars: 3,
          createdAt: new Date(`${d}T09:00:00.000Z`),
        },
      });
    }

    // 1. getOverview should now detect the habit
    const overview = await realHabitRepo.getOverview(testUserId);
    expect(overview.habits.length).toBeGreaterThanOrEqual(1);

    const trainsHabit = overview.habits.find((h) => h.key === "trains");
    expect(trainsHabit).toBeDefined();
    expect(trainsHabit?.stage).toBe("forming");
    expect(trainsHabit?.status).toBeDefined();
    expect(overview.firstHabits).toBeNull(); // Once habit is detected, firstHabits is null

    // 2. Stage-up XP should have been awarded in HabitStageAward
    const awards = await db.habitStageAward.findMany({
      where: { userId: testUserId, habitKey: "trains" },
    });
    expect(awards.length).toBe(1);
    expect(awards[0]?.stage).toBe("FORMING");
    expect(awards[0]?.xp).toBe(5);

    // 3. Re-running getOverview should be idempotent (not award duplicate XP)
    await realHabitRepo.getOverview(testUserId);
    const awardsAfter = await db.habitStageAward.findMany({
      where: { userId: testUserId, habitKey: "trains" },
    });
    expect(awardsAfter.length).toBe(1);

    // 4. getDetail should return full habit detail
    const detail = await realHabitRepo.getDetail(testUserId, "trains");
    expect(detail.key).toBe("trains");
    expect(detail.weeklyCounts.length).toBeGreaterThanOrEqual(1);
    expect(detail.recent.length).toBe(3);
    expect(detail.recent[0]?.label).toContain("training");

    // 5. getDetail for unknown habit throws "Habit not found"
    await expect(realHabitRepo.getDetail(testUserId, "unknown-habit-key")).rejects.toThrow(
      /Habit not found/,
    );

    // 6. getCoachNote returns cached note for the current ISO week
    const note = await realHabitRepo.getCoachNote(testUserId);
    expect(note.lines.length).toBe(3);
    expect(note.source).toBe("rules");
    expect(note.isoWeek).toMatch(/^\d{4}-W\d{2}$/);
  });
});
