import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { habitRepo } from "@/data";
import { requireViewer } from "@/server/auth/session";
import { getOnboardingStatus } from "@/server/onboarding/status";
import { SetupClient } from "./setup-client";

export const metadata: Metadata = { title: "Set up your profile" };

async function SetupContent() {
  const viewer = await requireViewer();
  const { onboarded } = await getOnboardingStatus(viewer.id);
  if (onboarded) redirect("/");

  const templates = await habitRepo.listTemplates();
  return (
    <SetupClient
      name={viewer.name}
      initialAvatarKey={viewer.avatarKey}
      templates={templates.map((t) => ({
        key: t.key,
        title: t.title,
        icon: t.icon,
        description: t.description,
        frequency: t.frequency,
      }))}
    />
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-cream" />}>
      <SetupContent />
    </Suspense>
  );
}
