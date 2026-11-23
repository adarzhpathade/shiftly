"use client";

import { ForgotPasswordScreen } from "@/features/auth";
import { requestResetCodeAction, resetPasswordAction } from "@/server/auth/password-reset-actions";

export function ForgotPasswordClient() {
  return (
    <ForgotPasswordScreen
      loginHref="/login"
      onRequestCode={(email) => requestResetCodeAction(email)}
      onReset={({ email, code, newPassword }) => resetPasswordAction(email, code, newPassword)}
    />
  );
}
