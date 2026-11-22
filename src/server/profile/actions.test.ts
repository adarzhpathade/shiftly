import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/server/auth/session", () => ({
  requireViewer: vi.fn(),
}));
vi.mock("@/server/auth", () => ({
  unstable_update: vi.fn(),
}));
vi.mock("@/server/db", () => ({
  db: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/server/auth/session";
import { unstable_update } from "@/server/auth";
import { db } from "@/server/db";
import { saveBuddyAction } from "./actions";

describe("saveBuddyAction", () => {
  const mockViewer = {
    id: "u-alex",
    name: "Alex",
    role: "EMPLOYEE" as const,
    teamId: "team-1",
    avatarKey: "buddy-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireViewer).mockResolvedValue(mockViewer);
    vi.mocked(db.user.update).mockResolvedValue({} as never);
    vi.mocked(unstable_update).mockResolvedValue({} as never);
  });

  it("returns error when avatarKey is not a valid buddy key", async () => {
    const result = await saveBuddyAction("invalid-buddy");

    expect(result).toEqual({
      ok: false,
      error: "Pick one of the buddies",
    });
    expect(db.user.update).not.toHaveBeenCalled();
    expect(unstable_update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("updates DB, calls unstable_update, revalidates paths, and returns ok", async () => {
    const result = await saveBuddyAction("buddy-4");

    expect(result).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u-alex" },
      data: { avatarKey: "buddy-4" },
    });
    expect(unstable_update).toHaveBeenCalledWith({
      user: { avatarKey: "buddy-4" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("handles unstable_update error gracefully without failing the action", async () => {
    vi.mocked(unstable_update).mockRejectedValueOnce(new Error("Session store offline"));
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await saveBuddyAction("buddy-2");

    expect(result).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u-alex" },
      data: { avatarKey: "buddy-2" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
