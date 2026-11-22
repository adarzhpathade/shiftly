import { describe, it, expect, beforeEach } from "vitest";
import {
  isModelAllowed,
  assertAllowed,
  consumeBudget,
  resetBudgetForTests,
  DAILY_GROQ_BUDGET,
  DAILY_OPENROUTER_BUDGET,
} from "./guard";

beforeEach(() => {
  resetBudgetForTests();
});

describe("isModelAllowed", () => {
  it("allows the configured Groq model", () => {
    expect(isModelAllowed("groq", "openai/gpt-oss-120b")).toBe(true);
  });

  it("rejects an unknown Groq model", () => {
    expect(isModelAllowed("groq", "some-other/model")).toBe(false);
  });

  it("allows OpenRouter models ending in :free", () => {
    expect(isModelAllowed("openrouter", "baidu/ernie-5.5-flash-preview:free")).toBe(true);
    expect(isModelAllowed("openrouter", "perplexity/pplx-decider-flash-v1.3:free")).toBe(true);
  });

  it("rejects non-:free OpenRouter models", () => {
    expect(isModelAllowed("openrouter", "openai/gpt-4o")).toBe(false);
    expect(isModelAllowed("openrouter", "anthropic/claude-3")).toBe(false);
  });
});

describe("assertAllowed", () => {
  it("does not throw for allowed model", () => {
    expect(() => assertAllowed("groq", "openai/gpt-oss-120b")).not.toThrow();
    expect(() => assertAllowed("openrouter", "some-model:free")).not.toThrow();
  });

  it("throws for disallowed model", () => {
    expect(() => assertAllowed("openrouter", "openai/gpt-4o")).toThrow();
    expect(() => assertAllowed("groq", "some-other/model")).toThrow();
  });
});

describe("consumeBudget", () => {
  it("allows consumption up to Groq budget cap", () => {
    // Exhaust the budget
    for (let i = 0; i < DAILY_GROQ_BUDGET; i++) {
      expect(consumeBudget("groq")).toBe(true);
    }
    // Next one should fail
    expect(consumeBudget("groq")).toBe(false);
  });

  it("allows consumption up to OpenRouter budget cap", () => {
    for (let i = 0; i < DAILY_OPENROUTER_BUDGET; i++) {
      expect(consumeBudget("openrouter")).toBe(true);
    }
    expect(consumeBudget("openrouter")).toBe(false);
  });

  it("resets correctly between tests", () => {
    // After beforeEach reset, fresh budget should work
    expect(consumeBudget("groq")).toBe(true);
    expect(consumeBudget("openrouter")).toBe(true);
  });
});
