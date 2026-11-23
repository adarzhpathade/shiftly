"use client";

import { useRouter } from "next/navigation";
import { SetupFlow } from "@/features/onboarding";
import { completeOnboardingAction } from "@/server/onboarding/actions";

export function SetupClient({
  name,
  initialAvatarKey,
}: {
  name: string;
  initialAvatarKey?: string;
}) {
  const router = useRouter();
  return (
    <SetupFlow
      name={name}
      initialAvatarKey={initialAvatarKey}
      onComplete={async (input) => {
        const result = await completeOnboardingAction(input);
        if (result.ok) {
          router.replace("/");
          router.refresh();
        }
        return result;
      }}
    />
  );
}
