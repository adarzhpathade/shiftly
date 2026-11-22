"use client";

import { useRouter } from "next/navigation";
import { SetupFlow, type SetupTemplate } from "@/features/onboarding";
import { completeOnboardingAction } from "@/server/onboarding/actions";

export function SetupClient({
  name,
  initialAvatarKey,
  templates,
}: {
  name: string;
  initialAvatarKey?: string;
  templates: readonly SetupTemplate[];
}) {
  const router = useRouter();
  return (
    <SetupFlow
      name={name}
      initialAvatarKey={initialAvatarKey}
      templates={templates}
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
