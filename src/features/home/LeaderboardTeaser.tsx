import { Card } from "@/components/ui/Card";
import { GameObject } from "@/components/ui/GameObject";
import type { LeaderboardEntry } from "@/lib/types";

export interface LeaderboardTeaserProps {
  myRank: LeaderboardEntry | null;
}

export function LeaderboardTeaser({ myRank }: LeaderboardTeaserProps) {
  if (!myRank) return null;

  return (
    <section aria-label="Leaderboard">
      <Card
        tone="ink"
        padding="md"
        className="flex items-center gap-3 rounded-[26px]"
      >
        <GameObject name="trophy" size={64} float className="flex-none" />
        <div className="min-w-0 flex-1">
          <p className="text-[22px] leading-[1.05] font-extrabold tracking-[-0.02em]">
            You are #{myRank.rank} this week
          </p>
          <span className="mt-1 block text-[13px] font-bold text-lime">
            {myRank.xp} XP
          </span>
        </div>
        <a
          href="/leaderboard"
          className="inline-flex min-h-11 flex-none items-center rounded-pill bg-lime px-4 text-[13px] font-extrabold text-ink transition-transform duration-300 ease-spring active:scale-95"
        >
          View
        </a>
      </Card>
    </section>
  );
}
