import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { GameObject } from "@/components/ui/GameObject";
import type { ContinueTraining, TodaysChallenge } from "@/lib/types";

export interface TodayCardProps {
  challenge: TodaysChallenge;
  continueTraining: ContinueTraining | null;
}

const CATEGORY_TONE = {
  "handling-complaints": "peach",
  "customer-queries": "sky",
  "difficult-customers": "lav",
  "problem-solving": "lime",
} as const;

export function TodayCard({ challenge, continueTraining }: TodayCardProps) {
  const level = (challenge.scenario as { level?: number }).level;
  const tone = CATEGORY_TONE[challenge.categoryKey];

  return (
    <section aria-labelledby="today-heading" className="flex flex-col gap-3">
      <h2
        id="today-heading"
        className="text-xs font-bold tracking-widest text-ink-soft uppercase"
      >
        Today&apos;s Challenge
      </h2>
      <Card tone={tone} padding="lg" className="min-h-44">
        <div className="relative z-10 flex max-w-[62%] flex-col items-start gap-2">
          <Chip tone="paper">{challenge.categoryKey.replace(/-/g, " ")}</Chip>
          <h3 className="text-xl leading-tight font-extrabold">
            {challenge.scenario.title}
          </h3>
          <p className="text-sm font-medium text-ink-soft">
            {level !== undefined && <>Level {level} · </>}
            <span className="capitalize">{challenge.scenario.difficulty}</span>
          </p>
          <p className="text-sm font-bold">+{challenge.bonusXp} bonus XP</p>
          {challenge.completedToday ? (
            <p className="mt-1 rounded-pill bg-ink px-4 py-2 text-sm font-bold text-lime">
              Done for today
            </p>
          ) : (
            <a
              href="/training"
              className="mt-1 inline-flex min-h-11 items-center rounded-pill bg-ink px-6 text-sm font-bold text-cream transition-transform duration-300 ease-spring active:scale-95"
            >
              Start
            </a>
          )}
        </div>
        <GameObject
          name="rocket"
          size={132}
          float
          className="pointer-events-none absolute -right-2 bottom-3"
        />
      </Card>
      {continueTraining && (
        <Card tone="paper" className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold tracking-widest text-ink-soft uppercase">
              Continue Training
            </h3>
            <p className="truncate font-bold">{continueTraining.categoryName}</p>
            <p className="truncate text-sm text-ink-soft">
              {continueTraining.node.title}
            </p>
          </div>
          <a
            href="/training"
            className="inline-flex min-h-11 items-center rounded-pill bg-lime px-5 text-sm font-bold"
          >
            Continue
          </a>
        </Card>
      )}
    </section>
  );
}
