/** OpenAI-compatible chat completions caller. Never logs or returns API keys. */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallChatOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  json?: boolean;
  timeoutMs?: number;
  extra?: Record<string, unknown>;
}

export interface CallChatResult {
  ok: true;
  content: string;
}

export interface CallChatError {
  ok: false;
  error: string;
  status?: number;
}

export async function callChat(opts: CallChatOptions): Promise<CallChatResult | CallChatError> {
  const { baseUrl, apiKey, model, messages, json = false, timeoutMs = 20000, extra = {} } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model,
      messages,
      ...extra,
    };

    if (json) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}`, status: response.status };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim() === "") {
      return { ok: false, error: "Empty content from model" };
    }

    return { ok: true, content };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Request timed out" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  } finally {
    clearTimeout(timer);
  }
}

/** Call Groq with the gpt-oss reasoning model (single combined customer+judge call). */
export async function callGroq(
  messages: ChatMessage[],
  opts?: { timeoutMs?: number; json?: boolean },
): Promise<CallChatResult | CallChatError> {
  const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const apiKey = process.env.GROQ_API_KEY ?? "";
  const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

  return callChat({
    baseUrl,
    apiKey,
    model,
    messages,
    json: opts?.json ?? true,
    timeoutMs: opts?.timeoutMs ?? 20000,
    extra: {
      reasoning_effort: "low",
      max_completion_tokens: 1500,
      temperature: 0.7,
    },
  });
}

/** Call OpenRouter customer model (plain text). */
export async function callOpenRouterCustomer(
  messages: ChatMessage[],
  opts?: { timeoutMs?: number; json?: boolean },
): Promise<CallChatResult | CallChatError> {
  const baseUrl = process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  const model = process.env.AI_CUSTOMER_MODEL ?? "baidu/ernie-5.5-flash-preview:free";

  return callChat({
    baseUrl,
    apiKey,
    model,
    messages,
    json: opts?.json ?? false,
    timeoutMs: opts?.timeoutMs ?? 20000,
    extra: { max_tokens: 300 },
  });
}

/** Call OpenRouter judge model (JSON scores+mood+outcome). */
export async function callOpenRouterJudge(transcript: string): Promise<CallChatResult | CallChatError> {
  const baseUrl = process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  const model = process.env.AI_JUDGE_MODEL ?? "perplexity/pplx-decider-flash-v1.3:free";

  const judgeMessages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a silent evaluator of customer service agent performance. Given a conversation transcript, output ONLY valid JSON with these fields:
{
  "scores": { "empathy": <0-10>, "ownership": <0-10>, "clarity": <0-10>, "solution": <0-10>, "tone": <0-10> },
  "moodDelta": <-40 to 40>,
  "outcome": "continue" | "won" | "lost",
  "feedback": "<coaching tip, max 160 chars>"
}
No prose. JSON only.`,
    },
    {
      role: "user",
      content: transcript,
    },
  ];

  return callChat({
    baseUrl,
    apiKey,
    model,
    messages: judgeMessages,
    json: false,
    timeoutMs: 20000,
    extra: { max_tokens: 400 },
  });
}
