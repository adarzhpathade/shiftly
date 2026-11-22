import { Avatar } from "@/components/ui/Avatar";
import { BracketHeadline } from "@/components/ui/BracketHeadline";
import { Pop } from "@/components/ui/Motion";
import { StreakPill } from "@/components/ui/StreakPill";
import { Wordmark } from "@/components/ui/Wordmark";
import { XpBar } from "@/components/ui/XpBar";
import { progressToNextLevel } from "@/lib/gamification";
import type { UserSummary } from "@/lib/types";

export interface HomeHeaderProps {
  user: UserSummary;
  streak: number;
  xpProgress: number;
  xpToNext: number;
}

/** Wordmark + buddy + streak, bracket greeting, and the level bar (mock: `.bar-top`, `.greet`, `.xp`). */
export function HomeHeader({ user, streak, xpProgress }: HomeHeaderProps) {
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const progress = progressToNextLevel(user.xp);
  const xp =
    progress.xpForNext > 0 ? progress.xpIntoLevel : Math.round(xpProgress * 100);
  const nextXp = progress.xpForNext > 0 ? progress.xpForNext : 100;

  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Pop>
            <StreakPill count={streak} />
          </Pop>
          <Avatar name={user.name} avatarKey={user.avatarKey} size="md" />
        </div>
      </div>
      <BracketHeadline size="h1" className="mt-[18px] break-words">
        {`Hey,\n${firstName} [ready?]`}
      </BracketHeadline>
      <XpBar className="mt-3.5" level={user.level} xp={xp} nextXp={nextXp} />
    </header>
  );
}
