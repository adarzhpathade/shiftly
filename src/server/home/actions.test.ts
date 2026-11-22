import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/server/auth/session", () => ({
  requireViewer: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/server/auth/session";
import { habitRepo } from "@/data";
import { checkInHabitAction } from "./actions";

describe("home server actions", () => {
  const mockViewer = {
    id: "u-home-user",
    name: "Home User",
    role: "EMPLOYEE" as const,
    teamId: "team-home",
    avatarKey: "buddy-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireViewer).mockResolvedValue(mockViewer);
  });

  describe("checkInHabitAction", () => {
    it("checks in habit and returns xpEarned, streak, and celebrations array", async () => {
      const habit = await habitRepo.create("u-home-user", {
        title: `Home Habit ${Date.now()}`,
        icon: "target",
        frequency: "daily",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        reminderTime: null,
      });

      const result = await checkInHabitAction(habit.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.xpEarned).toBeGreaterThan(0);
        expect(typeof result.streak).toBe("number");
        expect(Array.isArray(result.celebrations)).toBe(true);
      }
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });

    it("returns error result when habit is not found", async () => {
      const result = await checkInHabitAction("unknown-habit-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Habit not found");
      }
    });

    it("returns error result when requireViewer fails", async () => {
      vi.mocked(requireViewer).mockRejectedValueOnce(new Error("Unauthorized"));

      const result = await checkInHabitAction("any-habit-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });
});
