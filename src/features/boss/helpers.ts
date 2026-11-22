import type { BossStreamEvent, TurnScores } from "@/lib/types";

export const SCORE_LABELS: Record<keyof TurnScores, string> = {
  empathy: "Empathy",
  ownership: "Ownership",
  clarity: "Clarity",
  solution: "Solution",
  tone: "Tone",
};

export const SCORE_KEYS = ["empathy", "ownership", "clarity", "solution", "tone"] as const;

export function averageScore(s: TurnScores): number {
  return SCORE_KEYS.reduce((sum, k) => sum + s[k], 0) / SCORE_KEYS.length;
}

const TIPS: Record<keyof TurnScores, string> = {
  empathy: "Acknowledge how they feel first.",
  ownership: "Say you will personally take this on.",
  clarity: "Keep it short and specific.",
  solution: "Offer a concrete next step and a time.",
  tone: "Keep your tone calm and warm.",
};

/** One-line tip: the model's own feedback when present, else a hint for the weakest skill. */
export function turnTip(scores: TurnScores, feedback?: string): string {
  if (feedback && feedback.trim()) return feedback.trim();
  if (SCORE_KEYS.every((k) => scores[k] >= 6)) return "Strong reply. Keep the momentum.";
  const weakest = SCORE_KEYS.reduce((min, k) => (scores[k] < scores[min] ? k : min), SCORE_KEYS[0]);
  return TIPS[weakest];
}

export type ChipTone = "great" | "ok" | "weak";

export function chipTone(avg: number): ChipTone {
  return avg >= 7 ? "great" : avg >= 4.5 ? "ok" : "weak";
}

/** Reaction emoji for a mood jump, or null when the change is small. */
export function reactionFor(delta: number): string | null {
  if (delta >= 15) return "🤩";
  if (delta >= 7) return "😊";
  if (delta <= -15) return "😡";
  if (delta <= -7) return "😠";
  return null;
}

/** Split an NDJSON buffer into complete events plus the unfinished tail. */
export function parseNdjson(buffer: string): { events: BossStreamEvent[]; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const events: BossStreamEvent[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    try {
      events.push(JSON.parse(t) as BossStreamEvent);
    } catch {
      /* skip a malformed line */
    }
  }
  return { events, rest };
}

/** POST a message and feed each streamed BossStreamEvent to `onEvent`. */
export async function streamTurn(
  url: string,
  text: string,
  onEvent: (e: BossStreamEvent) => void,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    onEvent({ type: "error", message: "Connection lost. Check your network and try again.", fallback: false });
    return;
  }
  if (!res.ok || !res.body) {
    onEvent({ type: "error", message: "Could not reach the customer. Try again.", fallback: false });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseNdjson(buffer);
    buffer = parsed.rest;
    parsed.events.forEach(onEvent);
  }
  const tail = parseNdjson(`${buffer}\n`);
  tail.events.forEach(onEvent);
}
