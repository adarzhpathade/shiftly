import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { GameObject } from "@/components/ui/GameObject";
import { PhotoCard } from "@/components/ui/PhotoCard";
import type { ContinueTraining, TodaysChallenge } from "@/lib/types";

export interface TodayCardProps {
  challenge: TodaysChallenge;
  continueTraining: ContinueTraining | null;
}

/** Bracket the last word of the title, like "Calm the [angry] caller". */
function bracketTitle(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return `[${title}]`;
  const last = words.pop();
  return `${words.join(" ")} [${last}]`;
}

/** Hero photo card with the headset buddy peeking over the corner (mock: `.photo-card`). */
export function TodayCard({ challenge, continueTraining }: TodayCardProps) {
  const done = challenge.completedToday;
  return (
    <section aria-label="Today's challenge" className="flex flex-col gap-3 pt-6">
      <PhotoCard
        chip="Today's challenge"
        title={bracketTitle(challenge.scenario.title)}
        sticker="headset"
        cta={
          done ? (
            <span className="inline-flex -mb-1 min-h-[34px] items-center rounded-pill bg-paper px-3.5 text-[13px] font-extrabold">
              Done for today
            </span>
          ) : (
            <a
              href="/training"
              className="inline-flex -mb-1 min-h-[34px] items-center rounded-pill bg-lime px-3.5 text-[13px] font-extrabold tracking-tight text-ink transition-transform duration-300 ease-spring select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink active:scale-95"
            >
              Play · +{challenge.bonusXp} XP
            </a>
          )
        }
      />
      {continueTraining && (
        <Card tone="paper" className="flex items-center gap-3 rounded-[22px]">
          <GameObject name="target" size={44} className="flex-none" />
          <div className="min-w-0 flex-1">
            <Chip tone="lav">Continue</Chip>
            <p className="mt-1.5 truncate text-[15px] font-extrabold">
              {continueTraining.categoryName}
            </p>
            <p className="truncate text-xs text-ink-soft">
              {continueTraining.node.title}
            </p>
          </div>
          <a
            href="/training"
            className="inline-flex min-h-11 flex-none items-center rounded-pill bg-ink px-5 text-[13px] font-extrabold text-cream transition-transform duration-300 ease-spring active:scale-95"
          >
            Go
          </a>
        </Card>
      )}
    </section>
  );
}
