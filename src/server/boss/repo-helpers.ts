import { replayXp } from "@/lib/gamification";
import type { Stars } from "@/lib/gamification";

/**
 * Extracts the opening line from a system prompt if it ends with `OPENING: <text>`.
 * Returns null if no such suffix is found.
 */
export function parseOpeningLine(systemPrompt: string): string | null {
  // Find last OPENING: line without /s flag (not ES2017-compatible)
  const lines = systemPrompt.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i] ?? "";
    const idx = line.indexOf("OPENING:");
    if (idx !== -1) {
      return line.slice(idx + "OPENING:".length).trim() || null;
    }
  }
  return null;
}

/**
 * Maps a session status + average score to a star rating.
 * - won + avgScore >= 8: 3 stars
 * - won + avgScore >= 6: 2 stars
 * - won: 1 star
 * - lost/fallback: 0 stars
 */
export function computeStars(status: string, avgScore: number): 0 | 1 | 2 | 3 {
  if (status !== "won") return 0;
  if (avgScore >= 8) return 3;
  if (avgScore >= 6) return 2;
  return 1;
}

/**
 * Computes XP earned using the replay formula:
 * only the improvement over the previous best is rewarded.
 */
export function computeXp(prevBestStars: Stars, stars: Stars, xpReward: number): number {
  return replayXp(prevBestStars, stars, xpReward);
}
