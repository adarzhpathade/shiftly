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
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

export { toFieldErrors };
