"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { habitRepo } from "@/data";
import { buildCelebrations } from "@/lib/celebrations";
import { requireViewer } from "@/server/auth/session";
import { parseHabitForm } from "./validation";
import type {
  CheckInActionResult,
  HabitFormState,
  HabitMutationResult,
} from "./types";

export async function checkInAction(
  habitId: string,
): Promise<CheckInActionResult> {
  try {
    const viewer = await requireViewer();
    const result = await habitRepo.checkIn(viewer.id, habitId);
    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath(`/habits/${habitId}`);
    return {
      ok: true,
      xpEarned: result.xpEarned,
      streak: result.streak,
      ...(result.leveledUp ? { leveledUp: result.leveledUp.newLevel } : {}),
      celebrations: buildCelebrations(result),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to check in habit",
    };
  }
}

export async function saveHabitAction(
  habitId: string | null,
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  let viewer: Awaited<ReturnType<typeof requireViewer>>;
  try {
    viewer = await requireViewer();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }

  const parsed = parseHabitForm(formData);
  if (!parsed.ok) {
    return {
      ok: false,
      fieldErrors: parsed.fieldErrors,
    };
  }

  let targetId: string;
  try {
    if (habitId) {
      const updated = await habitRepo.update(viewer.id, habitId, parsed.input);
      targetId = updated.id;
    } else {
      const created = await habitRepo.create(viewer.id, parsed.input);
      targetId = created.id;
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save habit",
    };
  }

  revalidatePath("/habits");
  revalidatePath("/");
  revalidatePath(`/habits/${targetId}`);
  redirect(`/habits/${targetId}`);
}

export async function deleteHabitAction(
  habitId: string,
): Promise<HabitMutationResult> {
  try {
    const viewer = await requireViewer();
    await habitRepo.remove(viewer.id, habitId);
    revalidatePath("/habits");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete habit",
    };
  }
}
