import { Suspense } from "react";
import { requireViewer } from "@/server/auth/session";
import { formatResetIn } from "@/server/leaderboard-ui/week-reset";
import { loadLeaderboardView } from "@/server/leaderboard-ui/load";
import { LeaderboardRoute } from "./LeaderboardRoute";
import LeaderboardLoading from "./loading";

type SearchParams = Promise<{ scope?: string | string[]; period?: string | string[] }>;

async function LeaderboardContent({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await requireViewer();
  const view = await loadLeaderboardView(viewer.id, await searchParams);
  return (
    <LeaderboardRoute
      leaderboard={view.leaderboard}
      scope={view.scope}
      period={view.period}
      resetsIn={view.resetsInMs === null ? null : formatResetIn(view.resetsInMs)}
    />
  );
}

export default function LeaderboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<LeaderboardLoading />}>
      <LeaderboardContent searchParams={searchParams} />
    </Suspense>
  );
}
