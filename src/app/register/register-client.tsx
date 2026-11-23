"use client";

import { useRouter } from "next/navigation";
import { RegisterScreen } from "@/features/auth";
import type { RegistrationTeam } from "@/lib/types";
import { registerAction } from "@/server/auth/actions";

export function RegisterClient({ teams }: { teams: RegistrationTeam[] }) {
  const router = useRouter();
  return (
    <RegisterScreen
      teams={teams}
      loginHref="/login"
      onSubmit={async (input) => {
        return registerAction(input);
      }}
      onSuccess={() => {
        router.replace("/setup");
        router.refresh();
      }}
    />
  );
}
