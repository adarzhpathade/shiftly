"use server";

import { passwordResetRepo } from "@/data";
import {
  RESET_CODE_LENGTH,
  RESET_MIN_PASSWORD_LENGTH,
} from "@/lib/password-reset";
import type { PasswordResetRequestResult, PasswordResetVerifyResult } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Forgot password, step 1: email the code. Thin wrapper over PasswordResetRepository.requestCode.
 * Always `{ ok: true }` for a well-formed email, whether or not the account exists.
 */
export async function requestResetCodeAction(email: string): Promise<PasswordResetRequestResult> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) {
    return { ok: false, reason: "invalid", field: "email", message: "Enter a valid email address." };
  }
  return passwordResetRepo.requestCode(clean);
}

/**
 * Forgot password, step 2: check the code and set the new password. Thin wrapper over
 * PasswordResetRepository.verifyAndReset with basic input checks. After `{ ok: true }` the
 * screen sends the user to /login.
 */
export async function resetPasswordAction(
  email: string,
  code: string,
  newPassword: string,
): Promise<PasswordResetVerifyResult> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) {
    return { ok: false, reason: "invalid", field: "email", message: "Enter a valid email address." };
  }
  if (!new RegExp(`^\d{${RESET_CODE_LENGTH}}$`).test(code.trim())) {
    return { ok: false, reason: "invalid", field: "code", message: `The code is ${RESET_CODE_LENGTH} digits.` };
  }
  if (newPassword.length < RESET_MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      reason: "invalid",
      field: "newPassword",
      message: `Password must be at least ${RESET_MIN_PASSWORD_LENGTH} characters`,
    };
  }
  return passwordResetRepo.verifyAndReset(clean, code.trim(), newPassword);
}
