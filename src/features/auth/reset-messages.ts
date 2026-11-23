/** Friendly wording for every password-reset result. Pure: no React, no server imports. */
import {
  RESET_CODE_LENGTH,
  RESET_CODE_TTL_MINUTES,
  RESET_MAX_REQUESTS_PER_HOUR,
} from "@/lib/password-reset";
import type {
  PasswordResetField,
  PasswordResetRequestResult,
  PasswordResetVerifyResult,
} from "@/lib/types";

/** Shown after step 1 no matter what, so the screen never reveals whether an account exists. */
export const CODE_SENT_TEXT = `If this email has an account, we sent a ${RESET_CODE_LENGTH}-digit code.`;

export type ResetNotice = {
  text: string;
  /** The input the message belongs to, when it is about one field. */
  field?: PasswordResetField;
  /** What the person should do next. */
  next: "fix" | "resend" | "wait";
  /** Seconds to wait, for `next: "wait"`. */
  retryAfterSeconds?: number;
};

/** "30 seconds", "1 minute", "about 30 minutes", "about 2 hours". */
export function formatWait(seconds: number): string {
  const s = Math.max(1, Math.ceil(seconds));
  if (s < 60) return `${s} second${s === 1 ? "" : "s"}`;
  const minutes = Math.ceil(s / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute" : `about ${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return `about ${hours} hour${hours === 1 ? "" : "s"}`;
}

/** The notice for step 1, or null when the code was sent. */
export function requestNotice(result: PasswordResetRequestResult): ResetNotice | null {
  if (result.ok) return null;
  if (result.reason === "invalid") {
    return { text: result.message, field: "email", next: "fix" };
  }
  return {
    text: `That is ${RESET_MAX_REQUESTS_PER_HOUR} codes in the last hour, which is the limit. Try again in ${formatWait(result.retryAfterSeconds)}.`,
    next: "wait",
    retryAfterSeconds: result.retryAfterSeconds,
  };
}

/** The notice for step 2, or null when the password was reset. */
export function verifyNotice(result: PasswordResetVerifyResult): ResetNotice | null {
  if (result.ok) return null;
  switch (result.reason) {
    case "invalid": {
      if (result.field === "code") {
        const left = result.attemptsLeft;
        const tail =
          left === undefined
            ? "Check it and try again."
            : left <= 0
              ? "Ask for a new code."
              : `${left} ${left === 1 ? "try" : "tries"} left.`;
        return { text: `That code is not right. ${tail}`, field: "code", next: "fix" };
      }
      return { text: result.message, field: result.field, next: "fix" };
    }
    case "expired":
      return {
        text: `That code has expired. Codes last ${RESET_CODE_TTL_MINUTES} minutes, so ask for a fresh one.`,
        field: "code",
        next: "resend",
      };
    case "too-many-tries":
      return {
        text: "Too many wrong tries, so that code is locked. Ask for a new one.",
        field: "code",
        next: "resend",
      };
    case "rate-limited":
      return {
        text: `You have tried a lot just now. Take a breather and try again in ${formatWait(result.retryAfterSeconds)}.`,
        next: "wait",
        retryAfterSeconds: result.retryAfterSeconds,
      };
  }
}
