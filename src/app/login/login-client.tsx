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
      demoAccounts={demoAccounts}
      onSubmit={async (input) => {
        const result = await loginAction(input);
        if (result.ok) {
          router.replace(callbackUrl);
          router.refresh();
        }
        return result;
      }}
    />
  );
}
