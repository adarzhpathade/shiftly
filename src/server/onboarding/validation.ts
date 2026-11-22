import { z } from "zod";
import { toFieldErrors } from "../auth/validation";

export const BUDDY_KEYS = [
  "buddy-1",
  "buddy-2",
  "buddy-3",
  "buddy-4",
  "buddy-5",
  "buddy-6",
] as const;

export type BuddyKey = (typeof BUDDY_KEYS)[number];

export const completeOnboardingSchema = z.object({
  avatarKey: z.enum(BUDDY_KEYS, {
    message: "Invalid avatar selection",
  }),
  templateIds: z
    .array(z.string().trim().min(1, "Template ID cannot be empty"))
    .min(2, "Select at least 2 habits")
    .max(3, "Select at most 3 habits")
    .refine((items) => new Set(items).size === items.length, {
      message: "Duplicate templates are not allowed",
    }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

export { toFieldErrors };
