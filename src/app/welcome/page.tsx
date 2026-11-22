import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/server/auth";
import { WelcomeClient } from "./welcome-client";

export const metadata: Metadata = { title: "Welcome to shiftly" };

async function WelcomeContent() {
  // Logged-in visitors only get here in intro review mode (NEXT_PUBLIC_INTRO_ALWAYS=1).
  const session = await auth();
  return <WelcomeClient doneHref={session?.user ? "/" : "/login"} />;
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-cream" />}>
      <WelcomeContent />
    </Suspense>
  );
}
