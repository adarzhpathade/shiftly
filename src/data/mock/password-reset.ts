/**
 * Mock PasswordResetRepository. The code is always 123456 (MOCK_RESET_CODE) and no email
 * is sent. It never changes a real password. Every result branch is reachable:
 *
 *   requestCode:
 *     - "not-an-email"                  -> invalid (field email)
 *     - 4th request for an email in 1h  -> rate-limited
 *     - anything else (known or not)    -> ok
 *   verifyAndReset:
 *     - email starting "expired"        -> expired
 *     - email starting "locked"         -> too-many-tries
 *     - email starting "limited"        -> rate-limited
 *     - new password under 8 chars      -> invalid (field newPassword)
 *     - code is not 123456              -> invalid (field code), 5th wrong guess -> too-many-tries
 *     - otherwise                       -> ok
 *
 * TODO(Mayur): real PasswordResetRepository in src/server/auth/ (PasswordResetCode table,
 * hashed codes, Gmail SMTP via GMAIL_USER and GMAIL_APP_PASSWORD), wired in src/data/index.ts.
 */
import {
  MOCK_RESET_CODE,
  RESET_MAX_ATTEMPTS,
  RESET_MAX_REQUESTS_PER_HOUR,
  RESET_MIN_PASSWORD_LENGTH,
} from "@/lib/password-reset";
import type { PasswordResetRepository } from "../repositories";
import { delay } from "./delay";
import { state } from "./state";

const HOUR_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalise(email: string): string {
  return email.trim().toLowerCase();
}

export const mockPasswordResetRepo: PasswordResetRepository = {
  async requestCode(email) {
    await delay();
    const key = normalise(email);
    if (!EMAIL_RE.test(key)) {
      return { ok: false, reason: "invalid", field: "email", message: "Enter a valid email address." };
    }
    const now = Date.now();
    const recent = (state.resetRequests.get(key) ?? []).filter((t) => now - t < HOUR_MS);
    if (recent.length >= RESET_MAX_REQUESTS_PER_HOUR) {
      const oldest = Math.min(...recent);
      state.resetRequests.set(key, recent);
      return { ok: false, reason: "rate-limited", retryAfterSeconds: Math.max(1, Math.ceil((oldest + HOUR_MS - now) / 1000)) };
    }
    state.resetRequests.set(key, [...recent, now]);
    // A new code resets the wrong-guess counter.
    state.resetAttempts.set(key, 0);
    return { ok: true };
  },

  async verifyAndReset(email, code, newPassword) {
    await delay();
    const key = normalise(email);
    if (key.startsWith("expired")) return { ok: false, reason: "expired" };
    if (key.startsWith("locked")) return { ok: false, reason: "too-many-tries" };
    if (key.startsWith("limited")) return { ok: false, reason: "rate-limited", retryAfterSeconds: 1800 };
    if (!EMAIL_RE.test(key)) {
      return { ok: false, reason: "invalid", field: "email", message: "Enter a valid email address." };
    }
    if (newPassword.length < RESET_MIN_PASSWORD_LENGTH) {
      return {
        ok: false,
        reason: "invalid",
        field: "newPassword",
        message: `Password must be at least ${RESET_MIN_PASSWORD_LENGTH} characters`,
      };
    }
    const used = state.resetAttempts.get(key) ?? 0;
    if (used >= RESET_MAX_ATTEMPTS) return { ok: false, reason: "too-many-tries" };
    if (code.trim() !== MOCK_RESET_CODE) {
      const next = used + 1;
      state.resetAttempts.set(key, next);
      if (next >= RESET_MAX_ATTEMPTS) return { ok: false, reason: "too-many-tries" };
      return {
        ok: false,
        reason: "invalid",
        field: "code",
        message: "That code is not right.",
        attemptsLeft: RESET_MAX_ATTEMPTS - next,
      };
    }
    state.resetAttempts.delete(key);
    return { ok: true };
  },
};
