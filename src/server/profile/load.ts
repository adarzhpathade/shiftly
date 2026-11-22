import "server-only";

import { gamificationRepo } from "@/data";
import type { Badge, Quest, UserProfile } from "@/lib/types";

export async function loadProfileView(
  userId: string,
): Promise<{ profile: UserProfile; badges: readonly Badge[]; quests: readonly Quest[] }> {
  const [profile, badges, quests] = await Promise.all([
    gamificationRepo.getProfile(userId),
    gamificationRepo.listBadges(userId),
    gamificationRepo.listQuests(userId),
  ]);
  return { profile, badges, quests };
}
