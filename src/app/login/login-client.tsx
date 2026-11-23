"use client";

import { useRouter } from "next/navigation";
import { LoginScreen, type DemoAccount } from "@/features/auth";
import { loginAction } from "@/server/auth/actions";

export function LoginClient({
  callbackUrl,
  demoAccounts,
}: {
  callbackUrl: string;
  demoAccounts?: readonly DemoAccount[];
}) {
  const router = useRouter();
  return (
    <LoginScreen
      registerHref="/register"
      forgotHref="/forgot-password"
      demoAccounts={demoAccounts}
      onSubmit={async (input) => {
        return loginAction(input);
      }}
      onSuccess={() => {
        router.replace(callbackUrl);
        router.refresh();
      }}
    />
  );
}
