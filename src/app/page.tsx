import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HomePlaceholder } from "@/features/onboarding/HomePlaceholder";
import { logoutAction } from "@/server/auth/actions";
import { requireViewer } from "@/server/auth/session";
import { getOnboardingStatus } from "@/server/onboarding/status";

async function HomeContent() {
  const viewer = await requireViewer();
  const { onboarded } = await getOnboardingStatus(viewer.id);
  if (!onboarded) redirect("/setup");
  return (
    <HomePlaceholder
      name={viewer.name}
      avatarKey={viewer.avatarKey}
      onLogout={logoutAction}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-cream" />}>
      <HomeContent />
    </Suspense>
  );
}
