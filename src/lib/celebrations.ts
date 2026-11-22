/** Celebration events shown as full-screen overlays. Pure TypeScript, serializable. */
import type { Badge, Quest } from "./types";

export type CelebrationEvent =
  | { type: "level-up"; level: number }
  | { type: "badge"; badge: { key: string; name: string; description: string; objectKey: string } }
  | { type: "streak"; days: 7 | 30 | 100 }
  | { type: "quest"; label: string; xpReward: number };

export interface CelebrationInput {
  leveledUp?: { newLevel: number } | { readonly newLevel: number };
  newBadges?: readonly Badge[];
  milestone?: 7 | 30 | 100;
  questsCompleted?: readonly Quest[];
}

/** Order: quests, badges, streak milestone, then level-up last. Skips absent parts. */
export function buildCelebrations(input: CelebrationInput): CelebrationEvent[] {
  const out: CelebrationEvent[] = [];
  for (const q of input.questsCompleted ?? []) {
    out.push({ type: "quest", label: q.label, xpReward: q.xpReward });
  }
  for (const b of input.newBadges ?? []) {
    out.push({
      type: "badge",
      badge: { key: b.key, name: b.name, description: b.description, objectKey: b.objectKey },
    });
  }
  if (input.milestone) out.push({ type: "streak", days: input.milestone });
  if (input.leveledUp) out.push({ type: "level-up", level: input.leveledUp.newLevel });
  return out;
}
