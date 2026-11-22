import type { TurnScores } from "@/lib/types";
import { parseTurnJson, type TurnJson } from "./schema";
import { assertAllowed, consumeBudget } from "./guard";
import { buildSystemPrompt, buildMessages } from "./prompt";
import { callGroq, callOpenRouterCustomer, callOpenRouterJudge } from "./providers";

export interface RunTurnInput {
  persona: {
    name: string;
    problem: string;
    hiddenGoal: string;
    systemPrompt: string;
  };
  mood: number;
  turn: number;
  maxTurns: number;
  history: readonly { role: "customer" | "user"; text: string }[];
  userText: string;
}

export type RunTurnResult =
  | {
      ok: true;
      data: TurnJson & { provider: "groq" | "openrouter" };
    }
  | { ok: false; reason: "fallback" };

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Enforce win/lose server-side from the new mood and turn number. */
function enforceOutcome(mood: number, turn: number, maxTurns: number): "won" | "lost" | "continue" {
  if (mood >= 80) return "won";
  if (mood <= 5) return "lost";
  if (turn >= maxTurns) return mood >= 60 ? "won" : "lost";
  return "continue";
}

export async function runTurn(input: RunTurnInput): Promise<RunTurnResult> {
  const { persona, mood, turn, maxTurns, history, userText } = input;

  const systemPromptText = buildSystemPrompt({
    personaName: persona.name,
    problem: persona.problem,
    hiddenGoal: persona.hiddenGoal,
    systemPrompt: persona.systemPrompt,
    mood,
    turn,
    maxTurns,
  });

  const messages = buildMessages(systemPromptText, history, userText);

  // --- Groq attempt ---
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

  if (groqApiKey && consumeBudget("groq")) {
    try {
      assertAllowed("groq", groqModel);

      let groqResult = await callGroq(messages);

      if (groqResult.ok) {
        let parsed = parseTurnJson(groqResult.content);

        // One JSON repair retry
        if (!parsed.ok) {
          const repairMessages = [
            ...messages,
            { role: "assistant" as const, content: groqResult.content },
            {
              role: "user" as const,
              content: "Your last output was not valid JSON. Return only the JSON object as specified.",
            },
          ];
          groqResult = await callGroq(repairMessages);
          if (groqResult.ok) {
            parsed = parseTurnJson(groqResult.content);
          }
        }

        if (parsed.ok) {
          const newMood = clamp(mood + parsed.data.moodDelta, 0, 100);
          const serverOutcome = enforceOutcome(newMood, turn, maxTurns);
          return {
            ok: true,
            data: {
              ...parsed.data,
              mood: newMood,
              outcome: serverOutcome,
              provider: "groq",
            },
          };
        }
      }
      // Groq failed — fall through to OpenRouter
    } catch {
      // Fall through
    }
  }

  // --- OpenRouter fallback ---
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const customerModel = process.env.AI_CUSTOMER_MODEL ?? "baidu/ernie-5.5-flash-preview:free";
  const judgeModel = process.env.AI_JUDGE_MODEL ?? "perplexity/pplx-decider-flash-v1.3:free";

  if (openRouterKey && consumeBudget("openrouter")) {
    try {
      assertAllowed("openrouter", customerModel);
      assertAllowed("openrouter", judgeModel);

      const customerResult = await callOpenRouterCustomer(messages);
      if (!customerResult.ok) {
        return { ok: false, reason: "fallback" };
      }

      const customerReply = customerResult.content.trim().slice(0, 600);

      // Build transcript for judge
      const transcript = `Agent said: "${userText}"\nCustomer replied: "${customerReply}"`;
      const judgeResult = await callOpenRouterJudge(transcript);

      let scores: TurnScores = { empathy: 5, ownership: 5, clarity: 5, solution: 5, tone: 5 };
      let moodDelta = 0;
      let feedback = "";

      if (judgeResult.ok) {
        const parsed = parseTurnJson(
          JSON.stringify({
            customerReply,
            mood: mood,
            moodDelta: 0,
            scores: { empathy: 5, ownership: 5, clarity: 5, solution: 5, tone: 5 },
            feedback: "",
            outcome: "continue",
            ...(() => {
              try {
                const j = JSON.parse(judgeResult.content) as Record<string, unknown>;
                return j;
              } catch {
                return {};
              }
            })(),
          }),
        );

        if (parsed.ok) {
          scores = parsed.data.scores;
          moodDelta = parsed.data.moodDelta;
          feedback = parsed.data.feedback;
        }
      }
      // If judge fails, use neutral scores (already set above)

      const newMood = clamp(mood + moodDelta, 0, 100);
      const serverOutcome = enforceOutcome(newMood, turn, maxTurns);

      return {
        ok: true,
        data: {
          customerReply,
          mood: newMood,
          moodDelta,
          scores,
          feedback,
          outcome: serverOutcome,
          provider: "openrouter",
        },
      };
    } catch {
      // Fall through
    }
  }

  return { ok: false, reason: "fallback" };
}
