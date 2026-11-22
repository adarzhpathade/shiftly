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
import {
  answerStepAction,
  finishAttemptAction,
  startAttemptAction,
} from "./actions";

describe("training server actions", () => {
  const mockViewer = {
    id: "u-alex",
    name: "Alex Rivera",
    role: "EMPLOYEE" as const,
    teamId: "team-alpha",
    avatarKey: "buddy-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireViewer).mockResolvedValue(mockViewer);
  });

  describe("startAttemptAction", () => {
    it("starts an attempt successfully via trainingRepo", async () => {
      const result = await startAttemptAction("sc-late-delivery");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.attemptId).toBeDefined();
        expect(typeof result.attemptId).toBe("string");
        expect(result.firstStepId).toBe("s1");
      }
    });

    it("returns error result when scenario is not found", async () => {
      const result = await startAttemptAction("non-existent-scenario");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Unknown scenario");
      }
    });

    it("returns error result when viewer check fails", async () => {
      vi.mocked(requireViewer).mockRejectedValueOnce(new Error("Unauthorized"));

      const result = await startAttemptAction("sc-late-delivery");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("answerStepAction", () => {
    it("answers a step successfully", async () => {
      const start = await startAttemptAction("sc-late-delivery");
      expect(start.ok).toBe(true);
      if (!start.ok) return;

      const answer = await answerStepAction(
        start.attemptId,
        start.firstStepId,
        "c1",
      );

      expect(answer.ok).toBe(true);
      if (answer.ok) {
        expect(answer.result.rating).toBe("best");
        expect(answer.result.points).toBe(10);
        expect(typeof answer.result.feedback).toBe("string");
      }
    });

    it("returns error result when attempt does not exist", async () => {
      const answer = await answerStepAction(
        "invalid-attempt-id",
        "s1",
        "c1",
      );

      expect(answer.ok).toBe(false);
      if (!answer.ok) {
        expect(answer.error).toContain("Attempt not found");
      }
    });

    it("returns error result when wrong step is answered", async () => {
      const start = await startAttemptAction("sc-late-delivery");
      expect(start.ok).toBe(true);
      if (!start.ok) return;

      const answer = await answerStepAction(
        start.attemptId,
        "wrong-step-id",
        "c1",
      );

      expect(answer.ok).toBe(false);
      if (!answer.ok) {
        expect(answer.error).toBeDefined();
      }
    });
  });

  describe("finishAttemptAction", () => {
    it("finishes a completed attempt and revalidates /training and /", async () => {
      const start = await startAttemptAction("sc-late-delivery");
      expect(start.ok).toBe(true);
      if (!start.ok) return;

      const answer = await answerStepAction(
        start.attemptId,
        start.firstStepId,
        "c1",
      );
      expect(answer.ok).toBe(true);

      const finish = await finishAttemptAction(start.attemptId);

      expect(finish.ok).toBe(true);
      if (finish.ok) {
        expect(finish.result.attemptId).toBe(start.attemptId);
        expect(finish.result.scenarioId).toBe("sc-late-delivery");
        expect(finish.result.stars).toBeGreaterThanOrEqual(0);
        expect(finish.result.perStep.length).toBe(1);
        expect(Array.isArray(finish.celebrations)).toBe(true);
      }

      expect(revalidatePath).toHaveBeenCalledWith("/training");
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });

    it("returns error when finishing an incomplete attempt", async () => {
      const start = await startAttemptAction("sc-double-charge");
      expect(start.ok).toBe(true);
      if (!start.ok) return;

      const finish = await finishAttemptAction(start.attemptId);

      expect(finish.ok).toBe(false);
      if (!finish.ok) {
        expect(finish.error).toContain("Attempt is not finished");
      }
    });

    it("returns error when attempt does not exist", async () => {
      const finish = await finishAttemptAction("fake-attempt-id");

      expect(finish.ok).toBe(false);
      if (!finish.ok) {
        expect(finish.error).toContain("Attempt not found");
      }
    });
  });
});
