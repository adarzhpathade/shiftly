"use server";

import { revalidatePath } from "next/cache";
import { trainingRepo } from "@/data";
import { requireViewer } from "@/server/auth/session";
import type {
  AnswerStepActionResult,
  FinishAttemptActionResult,
  StartAttemptActionResult,
} from "./types";

export async function startAttemptAction(
  scenarioId: string,
): Promise<StartAttemptActionResult> {
  try {
    const viewer = await requireViewer();
    const { attemptId, firstStepId } = await trainingRepo.startAttempt(
      viewer.id,
      scenarioId,
    );
    return {
      ok: true,
      attemptId,
      firstStepId,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to start attempt",
    };
  }
}

export async function answerStepAction(
  attemptId: string,
  stepId: string,
  choiceId: string,
): Promise<AnswerStepActionResult> {
  try {
    const viewer = await requireViewer();
    const result = await trainingRepo.answerStep(
      viewer.id,
      attemptId,
      stepId,
      choiceId,
    );
    return {
      ok: true,
      result,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to submit answer",
    };
  }
}

export async function finishAttemptAction(
  attemptId: string,
): Promise<FinishAttemptActionResult> {
  try {
    const viewer = await requireViewer();
    const result = await trainingRepo.finishAttempt(viewer.id, attemptId);
    revalidatePath("/training");
    revalidatePath("/");
    return {
      ok: true,
      result,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to finish attempt",
    };
  }
}
