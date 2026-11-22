import type { PrismaClient } from "@/generated/prisma/client";
import type { HabitInput, HabitTemplate } from "@/lib/types";
import { HABIT_TEMPLATES } from "@/data/mock/data";
import type { ActionResult } from "../auth/types";
import type { CompleteOnboardingInput } from "./validation";

export type CreateHabitFn = (input: HabitInput) => Promise<unknown>;

/**
 * Saves the buddy + onboardedAt and creates the starter habits through `createHabit`.
 * Idempotent: a user who is already onboarded is left untouched.
 */
export async function completeOnboardingCore(
  prisma: PrismaClient,
  userId: string,
  input: CompleteOnboardingInput,
  createHabit: CreateHabitFn,
  templates: readonly HabitTemplate[] = HABIT_TEMPLATES,
): Promise<ActionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, onboardedAt: true, avatarKey: true },
  });

  if (!user) {
    return { ok: false, error: "User not found" };
  }

  // Idempotent: no-op if already onboarded
  if (user.onboardedAt !== null) {
    return { ok: true };
  }

  // Verify all templateIds exist
  const selectedTemplates: HabitTemplate[] = [];
  for (const id of input.templateIds) {
    const tpl = templates.find((t) => t.key === id);
    if (!tpl) {
      return {
        ok: false,
        error: `Template not found: ${id}`,
        fieldErrors: { templateIds: `Template "${id}" not found` },
      };
    }
    selectedTemplates.push(tpl);
  }

  // Update user with avatarKey and onboardedAt = now
  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarKey: input.avatarKey,
      onboardedAt: new Date(),
    },
  });

  // Create each starter habit
  for (const tpl of selectedTemplates) {
    await createHabit({
      title: tpl.title,
      icon: tpl.icon,
      frequency: tpl.frequency,
      daysOfWeek: [...tpl.daysOfWeek],
      reminderTime: null,
    });
  }

  return { ok: true };
}
