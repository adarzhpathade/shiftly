import type { PrismaClient } from "@/generated/prisma/client";
import type { ActionResult } from "../auth/types";
import type { CompleteOnboardingInput } from "./validation";

/**
 * Saves the buddy + onboardedAt. Habits are no longer chosen: they are discovered from
 * what the user does. Idempotent: a user who is already onboarded is left untouched.
 */
export async function completeOnboardingCore(
  prisma: PrismaClient,
  userId: string,
  input: CompleteOnboardingInput,
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

  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarKey: input.avatarKey,
      onboardedAt: new Date(),
    },
  });

  return { ok: true };
}
