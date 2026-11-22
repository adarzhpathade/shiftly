/** Cost guard: allowlist + daily budget for Groq and OpenRouter. */

const GROQ_MODEL_ALLOWED = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const FREE_SUFFIX = ":free";

export const DAILY_GROQ_BUDGET = 800;
export const DAILY_OPENROUTER_BUDGET = 300;

// In-memory budget counters keyed by UTC date string "YYYY-MM-DD"
const budgetMap = new Map<string, number>();

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function budgetKey(provider: "groq" | "openrouter"): string {
  return `${provider}:${utcDate()}`;
}

/** Returns true if the model is allowed; false otherwise. */
export function isModelAllowed(provider: "groq" | "openrouter", model: string): boolean {
  if (provider === "groq") {
    return model === GROQ_MODEL_ALLOWED || model === "openai/gpt-oss-120b";
  }
  if (provider === "openrouter") {
    return model.endsWith(FREE_SUFFIX);
  }
  return false;
}

/** Throws if the model is not allowed. */
export function assertAllowed(provider: "groq" | "openrouter", model: string): void {
  if (!isModelAllowed(provider, model)) {
    throw new Error(`Model not allowed: provider=${provider}, model=${model}`);
  }
}

/**
 * Attempt to consume one request from the daily budget.
 * Returns true if consumed (budget available), false if exhausted.
 */
export function consumeBudget(provider: "groq" | "openrouter"): boolean {
  const key = budgetKey(provider);
  const current = budgetMap.get(key) ?? 0;
  const limit = provider === "groq" ? DAILY_GROQ_BUDGET : DAILY_OPENROUTER_BUDGET;
  if (current >= limit) return false;
  budgetMap.set(key, current + 1);
  return true;
}

/** Reset all budget counters (for use in tests only). */
export function resetBudgetForTests(): void {
  budgetMap.clear();
}
