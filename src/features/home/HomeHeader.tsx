import { Avatar } from "@/components/ui/Avatar";
import { StreakPill } from "@/components/ui/StreakPill";
import { XpBar } from "@/components/ui/XpBar";
import { progressToNextLevel } from "@/lib/gamification";
import type { UserSummary } from "@/lib/types";

export interface HomeHeaderProps {
  user: UserSummary;
  streak: number;
  xpProgress: number;
  xpToNext: number;
}

export function HomeHeader({
  user,
  streak,
  xpProgress,
  xpToNext,
}: HomeHeaderProps) {
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const progress = progressToNextLevel(user.xp);
  const xp =
    progress.xpForNext > 0
      ? progress.xpIntoLevel
      : Math.round(xpProgress * 100);
  const nextXp = progress.xpForNext > 0 ? progress.xpForNext : 100;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} avatarKey={user.avatarKey} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[26px] leading-tight font-extrabold tracking-tight">
            Hi, {firstName}
          </h1>
          <span className="mt-0.5 inline-block rounded-pill bg-ink px-2.5 py-1 text-[11px] leading-none font-bold tracking-wider text-lime uppercase">
            Lvl {user.level}
          </span>
        </div>
        <StreakPill count={streak} />
      </div>
      <div className="flex flex-col gap-1.5">
        <XpBar level={user.level} xp={xp} nextXp={nextXp} />
        <p className="text-xs font-medium text-ink-soft">
          {xpToNext} XP to next level
        </p>
      </div>
    </header>
  );
}
