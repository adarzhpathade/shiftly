import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

class RedirectSentinelError extends Error {
  url: string;
  constructor(url: string) {
    super(`NEXT_REDIRECT: ${url}`);
    this.name = "RedirectSentinelError";
    this.url = url;
  }
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectSentinelError(url);
  }),
}));

vi.mock("@/server/auth/session", () => ({
  requireViewer: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireViewer } from "@/server/auth/session";
import { habitRepo } from "@/data";
import {
  checkInAction,
  saveHabitAction,
  deleteHabitAction,
} from "./actions";

describe("habits-ui server actions", () => {
  const mockViewer = {
    id: "u-me",
    name: "Me",
    role: "EMPLOYEE" as const,
    teamId: "team-1",
    avatarKey: "buddy-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireViewer).mockResolvedValue(mockViewer);
  });

  describe("saveHabitAction", () => {
    it("create success redirects to /habits/<newId>", async () => {
      const uniqueTitle = `Habit ${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const formData = new FormData();
      formData.set("title", uniqueTitle);
      formData.set("icon", "water");
      formData.append("days", "1");
      formData.append("days", "3");
      formData.append("days", "5");
      formData.set("reminderTime", "08:30");

      let caughtError: unknown;
      try {
        await saveHabitAction(null, null, formData);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(RedirectSentinelError);
      expect(redirect).toHaveBeenCalledTimes(1);

      const redirectCall = vi.mocked(redirect).mock.calls[0];
      expect(redirectCall).toBeDefined();
      const redirectUrl = redirectCall?.[0] as string;
      expect(redirectUrl).toMatch(/^\/habits\/.+$/);
      const newId = redirectUrl.replace("/habits/", "");

      expect(revalidatePath).toHaveBeenCalledWith("/habits");
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(revalidatePath).toHaveBeenCalledWith(`/habits/${newId}`);

      const habits = await habitRepo.listToday("u-me");
      const created = habits.find((h) => h.id === newId);
      expect(created).toBeDefined();
      expect(created?.title).toBe(uniqueTitle);
      expect(created?.icon).toBe("water");
      expect(created?.frequency).toBe("weekly");
      expect(created?.daysOfWeek).toEqual([1, 3, 5]);
      expect(created?.reminderTime).toBe("08:30");
    });

    it("update changes the title", async () => {
      const habit = await habitRepo.create("u-me", {
        title: `Init ${Date.now()}-${Math.random().toString(36).slice(2)}`,
        icon: "book",
        frequency: "daily",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        reminderTime: null,
      });

      const updatedTitle = `Updated ${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const formData = new FormData();
      formData.set("title", updatedTitle);
      formData.set("icon", "book");
      for (let d = 1; d <= 7; d++) {
        formData.append("days", String(d));
      }
      formData.set("reminderTime", "");

      let caughtError: unknown;
      try {
        await saveHabitAction(habit.id, null, formData);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(RedirectSentinelError);
      expect(redirect).toHaveBeenCalledWith(`/habits/${habit.id}`);
      expect(revalidatePath).toHaveBeenCalledWith("/habits");
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(revalidatePath).toHaveBeenCalledWith(`/habits/${habit.id}`);

      const habits = await habitRepo.listToday("u-me");
      const updated = habits.find((h) => h.id === habit.id);
      expect(updated?.title).toBe(updatedTitle);
    });

    it("invalid input returns fieldErrors and creates nothing", async () => {
      const beforeHabits = await habitRepo.listToday("u-me");
      const beforeCount = beforeHabits.length;

      const formData = new FormData();
      formData.set("title", "   ");
      formData.set("icon", "water");
      formData.append("days", "1");
      formData.set("reminderTime", "");

      const result = await saveHabitAction(null, null, formData);

      expect(redirect).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.ok).toBe(false);
      expect(result?.fieldErrors?.title).toBe("Give your habit a name");

      const afterHabits = await habitRepo.listToday("u-me");
      expect(afterHabits.length).toBe(beforeCount);
    });

    it("returns error result when repository throws on update", async () => {
      const formData = new FormData();
      formData.set("title", "Non existent habit");
      formData.set("icon", "check");
      formData.append("days", "1");
      formData.set("reminderTime", "");

      const result = await saveHabitAction("non-existent-id-xyz", null, formData);

      expect(redirect).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.ok).toBe(false);
      expect(result?.error).toContain("Habit not found");
    });
  });

  describe("deleteHabitAction", () => {
    it("deleteHabitAction removes it (listToday no longer has it)", async () => {
      const habit = await habitRepo.create("u-me", {
        title: `ToDelete ${Date.now()}-${Math.random().toString(36).slice(2)}`,
        icon: "trash",
        frequency: "weekly",
        daysOfWeek: [2],
        reminderTime: null,
      });

      const beforeHabits = await habitRepo.listToday("u-me");
      expect(beforeHabits.some((h) => h.id === habit.id)).toBe(true);

      const result = await deleteHabitAction(habit.id);
      expect(result.ok).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith("/habits");
      expect(revalidatePath).toHaveBeenCalledWith("/");

      const afterHabits = await habitRepo.listToday("u-me");
      expect(afterHabits.some((h) => h.id === habit.id)).toBe(false);
    });

    it("returns error result when habit is not found", async () => {
      const result = await deleteHabitAction("unknown-habit-id");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Habit not found");
      }
    });
  });

  describe("checkInAction", () => {
    it("returns ok with xpEarned > 0 the first time and 0 the second", async () => {
      const habit = await habitRepo.create("u-me", {
        title: `CheckIn ${Date.now()}-${Math.random().toString(36).slice(2)}`,
        icon: "target",
        frequency: "daily",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        reminderTime: null,
      });

      const first = await checkInAction(habit.id);
      expect(first.ok).toBe(true);
      if (first.ok) {
        expect(first.xpEarned).toBeGreaterThan(0);
        expect(typeof first.streak).toBe("number");
      }
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(revalidatePath).toHaveBeenCalledWith("/habits");
      expect(revalidatePath).toHaveBeenCalledWith(`/habits/${habit.id}`);

      const second = await checkInAction(habit.id);
      expect(second.ok).toBe(true);
      if (second.ok) {
        expect(second.xpEarned).toBe(0);
      }
    });

    it("returns error result when habit is not found", async () => {
      const result = await checkInAction("non-existent-habit");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Habit not found");
      }
    });
  });
});
