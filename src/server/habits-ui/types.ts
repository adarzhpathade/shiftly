import type { CheckInActionResult } from "../home/types";

export type { CheckInActionResult };

export type HabitFormState = {
  ok: false;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export type HabitMutationResult =
  | { ok: true }
  | { ok: false; error: string };
