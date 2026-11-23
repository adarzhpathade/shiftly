import type { CoachSummary } from "./summary";
import { generateRulesNote } from "./rules";
import { getAiMode } from "@/server/boss/mode";
import { assertAllowed, consumeBudget } from "@/server/boss/guard";
import {
  callGroq,
  callOpenRouterCustomer,
  type ChatMessage,
} from "@/server/boss/providers";

export interface CoachAiResult {
  readonly lines: readonly [string, string, string];
  readonly source: "ai" | "rules";
}

const EMOJI_REGEX =
  /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

/**
 * Validates AI response: must be exactly 3 non-empty lines, each <= 90 characters, no emojis.
 */
export function validateAiLines(content: string): [string, string, string] | null {
  try {
    let candidateLines: unknown = null;

    // 1. Try parsing direct JSON
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        candidateLines = parsed;
      } else if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { lines?: unknown }).lines)
      ) {
        candidateLines = (parsed as { lines: unknown[] }).lines;
      }
    } catch {
      // Not raw JSON, try extracting JSON substring
      const jsonMatch = content.match(/\{[\s\S]*"lines"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.lines)) {
            candidateLines = parsed.lines;
          }
        } catch {
          // fall through
        }
      }
    }

    // 2. If not a JSON array, split text by newlines
    if (!Array.isArray(candidateLines)) {
      candidateLines = content
        .split("\n")
        .map((l) =>
          l
            .replace(/^[\d+*•-]\s*[:.)]?\s*/, "")
            .replace(/^["']|["']$/g, "")
            .trim(),
        )
        .filter((l) => l.length > 0);
    }

    if (!Array.isArray(candidateLines) || candidateLines.length !== 3) {
      return null;
    }

    const cleanLines: string[] = [];
    for (const item of candidateLines) {
      if (typeof item !== "string") return null;
      const trimmed = item.trim();
      if (trimmed.length === 0 || trimmed.length > 90) return null;
      if (EMOJI_REGEX.test(trimmed)) return null;
      cleanLines.push(trimmed);
    }

    if (cleanLines.length !== 3) {
      return null;
    }

    const [first, second, third] = cleanLines;
    if (!first || !second || !third) {
      return null;
    }

    return [first, second, third];
  } catch {
    return null;
  }
}

/** Builds chat messages from pure numbers and category identifiers. Never names or emails. */
function buildMessages(summary: CoachSummary): ChatMessage[] {
  const factSheetNumbers = {
    daysActive: summary.daysActive,
    totalScenariosFinished: summary.totalScenariosFinished,
    scenariosFinishedPerCategory: summary.scenariosFinishedPerCategory,
    averageStars: summary.averageStars,
    bossCallsWon: summary.bossCallsWon,
    bossCallsLost: summary.bossCallsLost,
    perfectScores: summary.perfectScores,
    questsCompleted: summary.questsCompleted,
    mostActiveDayPart: summary.mostActiveDayPart,
    changeVsLastWeek: summary.changeVsLastWeek,
    weakestCategory: summary.weakestCategory,
  };

  const systemPrompt = `You are a warm, encouraging coach for customer service representatives.
Given a weekly fact sheet containing activity numbers and category keys, write a coach note of EXACTLY 3 lines.

Strict Constraints:
1. Return ONLY valid JSON: {"lines": ["<line 1>", "<line 2>", "<line 3>"]}
2. Exactly 3 lines in the array.
3. Every single line MUST be 90 characters or fewer.
4. Warm, supportive, and specific.
5. Base your comments ONLY on the numbers in the fact sheet.
6. NO emojis anywhere.
7. NO names, usernames, or email addresses.
8. Line 1: celebrate their practice consistency or active days.
9. Line 2: highlight an achievement like high ratings, quests, or boss calls.
10. Line 3: give one practical tip for next week (mention the weakest category if one is present).`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(factSheetNumbers) },
  ];
}

async function runProviderChain(
  summary: CoachSummary,
  timeoutMs: number,
): Promise<[string, string, string] | null> {
  const messages = buildMessages(summary);

  // 1. Try Groq
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

  if (groqApiKey && consumeBudget("groq")) {
    try {
      assertAllowed("groq", groqModel);
      const res = await callGroq(messages, { timeoutMs: Math.min(timeoutMs, 5000), json: true });
      if (res.ok) {
        const validated = validateAiLines(res.content);
        if (validated) return validated;
      }
    } catch {
      // Fall through to OpenRouter
    }
  }

  // 2. Try OpenRouter fallback
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openRouterModel =
    process.env.AI_CUSTOMER_MODEL ?? "baidu/ernie-5.5-flash-preview:free";

  if (openRouterKey && consumeBudget("openrouter")) {
    try {
      assertAllowed("openrouter", openRouterModel);
      const res = await callOpenRouterCustomer(messages, {
        timeoutMs: Math.min(timeoutMs, 5000),
      });
      if (res.ok) {
        const validated = validateAiLines(res.content);
        if (validated) return validated;
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Attempts to generate a 3-line weekly coach note via the AI provider chain.
 * Falls back to rules note on AI_MODE=mock, timeout (8s), invalid output, or provider failure.
 */
export async function generateCoachNote(summary: CoachSummary): Promise<CoachAiResult> {
  const rulesLines = generateRulesNote(summary);

  if (getAiMode() === "mock") {
    return { lines: rulesLines, source: "rules" };
  }

  const timeoutMs = 8000;

  try {
    const aiPromise = runProviderChain(summary, timeoutMs);
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error("AI generation timed out (8s limit)")), timeoutMs);
    });

    const lines = await Promise.race([aiPromise, timeoutPromise]);
    if (lines) {
      return { lines, source: "ai" };
    }
  } catch {
    // Timeout or unexpected error -> fall through to rules
  }

  return { lines: rulesLines, source: "rules" };
}
