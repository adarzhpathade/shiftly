"use client";

import { useRouter } from "next/navigation";
import { RegisterScreen } from "@/features/auth";
import { registerAction } from "@/server/auth/actions";

export function RegisterClient({ teams }: { teams: { id: string; name: string }[] }) {
  const router = useRouter();
  return (
    <RegisterScreen
      teams={teams}
      loginHref="/login"
      onSubmit={async (input) => {
        const result = await registerAction(input);
        if (result.ok) {
          router.replace("/setup");
          router.refresh();
        }
        return result;
      }}
    />
  );
}
