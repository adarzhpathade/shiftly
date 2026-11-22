import type { AnswerResult, CategoryKey, ScenarioResult } from "@/lib/types";
import type { CelebrationEvent } from "@/lib/celebrations";

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  "handling-complaints",
  "customer-queries",
  "difficult-customers",
  "problem-solving",
] as const;

export function isCategoryKey(key: string): key is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(key);
}

export type StartAttemptActionResult =
  | {
      readonly ok: true;
      readonly attemptId: string;
      readonly firstStepId: string;
    }
  | {
      readonly ok: false;
      readonly error: string;
    };

export type AnswerStepActionResult =
  | {
      readonly ok: true;
      readonly result: AnswerResult;
    }
  | {
      readonly ok: false;
      readonly error: string;
    };

export type FinishAttemptActionResult =
  | {
      readonly ok: true;
      readonly result: ScenarioResult;
      readonly celebrations: CelebrationEvent[];
    }
  | {
      readonly ok: false;
      readonly error: string;
    };
