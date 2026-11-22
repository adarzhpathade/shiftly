import { Card } from "@/components/ui/Card";
import { GameObject } from "@/components/ui/GameObject";
import type { LeaderboardEntry } from "@/lib/types";

export interface LeaderboardTeaserProps {
  myRank: LeaderboardEntry | null;
}

export function LeaderboardTeaser({ myRank }: LeaderboardTeaserProps) {
  if (!myRank) {
    return null;
  }

  return (
    <section aria-labelledby="leaderboard-teaser-heading">
      <Card tone="ink" padding="lg" className="flex items-center gap-4">
        <GameObject name="trophy" size={64} float />
        <div className="min-w-0 flex-1">
          <h2
            id="leaderboard-teaser-heading"
            className="text-xs font-bold tracking-widest text-cream/70 uppercase"
          >
            Leaderboard
          </h2>
          <p className="text-lg leading-tight font-extrabold">
            You are #{myRank.rank} this week
          </p>
          <span className="text-sm font-medium text-lime">{myRank.xp} XP</span>
        </div>
        <a
          href="/leaderboard"
          className="inline-flex min-h-11 items-center rounded-pill bg-lime px-4 text-sm font-bold text-ink"
        >
          View
        </a>
      </Card>
    </section>
  );
}
