import { z } from "zod";

function clampInt(min: number, max: number) {
  return z
    .number()
    .int()
    .transform((v) => Math.min(max, Math.max(min, v)));
}

export const TurnJsonSchema = z.object({
  customerReply: z.string().min(1).max(600).trim(),
  mood: clampInt(0, 100),
  moodDelta: clampInt(-40, 40),
  scores: z.object({
    empathy: clampInt(0, 10),
    ownership: clampInt(0, 10),
    clarity: clampInt(0, 10),
    solution: clampInt(0, 10),
    tone: clampInt(0, 10),
  }),
  feedback: z.string().max(160),
  outcome: z.enum(["continue", "won", "lost"]),
});

export type TurnJson = z.infer<typeof TurnJsonSchema>;

/** Extract the first {...} block (tolerates ```json fences), parse and validate. */
export function parseTurnJson(raw: string): { ok: true; data: TurnJson } | { ok: false; error: string } {
  try {
    // Strip ```json ... ``` fences if present
    let cleaned = raw.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch?.[1]) {
      cleaned = fenceMatch[1].trim();
    }

    // Find the first { ... } block
    const start = cleaned.indexOf("{");
    if (start === -1) return { ok: false, error: "No JSON object found" };

    // Find matching closing brace
    let depth = 0;
    let end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) return { ok: false, error: "Unclosed JSON object" };

    const jsonStr = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr) as unknown;
    const result = TurnJsonSchema.safeParse(parsed);
    if (!result.success) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Parse error" };
  }
}
