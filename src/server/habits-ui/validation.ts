import { z } from "zod";
import type { HabitInput } from "@/lib/types";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

export const habitInputSchema = z
  .object({
    title: z
      .string({ error: "Give your habit a name" })
      .trim()
      .min(1, "Give your habit a name")
      .max(60, "Keep it under 60 characters"),
    icon: z
      .string({ error: "Pick an icon" })
      .regex(/^[a-z]{1,24}$/, "Pick an icon"),
    days: z.preprocess(
      (val) => {
        if (!val) return [];
        if (!Array.isArray(val)) return [val];
        return val;
      },
      z.array(z.unknown()).transform((items, ctx) => {
        if (items.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Pick at least one day",
          });
          return z.NEVER;
        }
        const nums: number[] = [];
        for (const item of items) {
          const n =
            typeof item === "number"
              ? item
              : typeof item === "string" && item.trim() !== ""
                ? Number(item)
                : NaN;
          if (!Number.isInteger(n) || n < 1 || n > 7) {
            ctx.addIssue({
              code: "custom",
              message: "Pick at least one day",
            });
            return z.NEVER;
          }
          nums.push(n);
        }
        const uniqueSorted = Array.from(new Set(nums)).sort((a, b) => a - b);
        if (uniqueSorted.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Pick at least one day",
          });
          return z.NEVER;
        }
        return uniqueSorted;
      }),
    ),
    reminderTime: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        return typeof val === "string" ? val.trim() : val;
      },
      z
        .string({ error: "Use a time like 08:30" })
        .regex(TIME_REGEX, "Use a time like 08:30")
        .nullable(),
    ),
  })
  .transform((data): HabitInput => {
    const isDaily = data.days.length === 7;
    return {
      title: data.title,
      icon: data.icon,
      frequency: isDaily ? "daily" : "weekly",
      daysOfWeek: data.days,
      reminderTime: data.reminderTime,
    };
  });

export type ParseHabitFormResult =
  | { ok: true; input: HabitInput }
  | { ok: false; fieldErrors: Record<string, string> };

export function parseHabitForm(formData: FormData): ParseHabitFormResult {
  const titleEntry = formData.get("title");
  const iconEntry = formData.get("icon");
  const reminderTimeEntry = formData.get("reminderTime");

  const raw = {
    title: typeof titleEntry === "string" ? titleEntry : undefined,
    icon: typeof iconEntry === "string" ? iconEntry : undefined,
    days: formData.getAll("days"),
    reminderTime: typeof reminderTimeEntry === "string" ? reminderTimeEntry : undefined,
  };

  const result = habitInputSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(result.error),
    };
  }

  return {
    ok: true,
    input: result.data,
  };
}
