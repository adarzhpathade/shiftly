"use client";

import { useRouter } from "next/navigation";
import { WelcomeFlow } from "@/features/onboarding";
import { markIntroSeenAction } from "@/server/onboarding/actions";

export function WelcomeClient() {
  const router = useRouter();
  return (
    <WelcomeFlow
      onFinish={async () => {
        await markIntroSeenAction();
        router.replace("/login");
      }}
    />
  );
}
