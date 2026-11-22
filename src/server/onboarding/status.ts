import "server-only";
import { db } from "@/server/db";

export async function getOnboardingStatus(userId: string): Promise<{ onboarded: boolean }> {
  if (!userId) {
    return { onboarded: false };
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardedAt: true },
  });
  return {
    onboarded: Boolean(user?.onboardedAt),
  };
}
