import { Suspense } from "react";
import { redirect } from "next/navigation";
import { homeRepo, leaderboardRepo } from "@/data";
import { HomeScreen } from "@/features/home";
import { requireViewer } from "@/server/auth/session";
import { checkInHabitAction } from "@/server/home/actions";
import { getOnboardingStatus } from "@/server/onboarding/status";
import type { LeaderboardEntry } from "@/lib/types";

async function HomeContent() {
  const viewer = await requireViewer();
  const { onboarded } = await getOnboardingStatus(viewer.id);
  if (!onboarded) {
    redirect("/setup");
  }

  const homeData = await homeRepo.getHome(viewer.id);

  let myRank: LeaderboardEntry | null = null;
  try {
    const leaderboard = await leaderboardRepo.get(viewer.id, "team", "week");
    myRank = leaderboard.me ?? null;
  } catch {
    myRank = null;
  }

  return (
    <HomeScreen
      data={homeData}
      myRank={myRank}
      onCheckIn={checkInHabitAction}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-cream" />}>
      <HomeContent />
    </Suspense>
  );
}
