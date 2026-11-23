import Link from "next/link";
import {
  BracketHeadline,
  GameObject,
  StageObject,
  cn,
} from "@/components/ui";
import { habitObject } from "@/lib/habit-icons";
import type { HabitSummary, HomeHabits } from "@/lib/types";

export interface HabitStripProps {
  habits: HomeHabits;
}

function Header() {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <BracketHeadline as="h2" size="h3">
        {"Your [habits]"}
      </BracketHeadline>
      <Link
        href="/habits"
        className="inline-flex min-h-9 flex-none items-center text-[13px] font-extrabold text-lav-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
      >
        See all
      </Link>
    </div>
  );
}

function StripCard({ habit }: { habit: HabitSummary }) {
  const slipping = habit.status === "slipping";
  return (
    <Link
      href={`/habits/${encodeURIComponent(habit.key)}`}
      className={cn(
        "flex w-[150px] flex-none snap-start flex-col justify-between gap-2 rounded-[20px] bg-paper p-3 transition-transform duration-300 ease-spring active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
        slipping && "ring-2 ring-peach",
      )}
    >
      <div className="flex items-start justify-between">
        <GameObject name={habitObject(habit.icon)} size={34} />
        <StageObject stage={habit.stage} size={24} />
      </div>
      <p className="line-clamp-2 min-h-[2.3em] text-[13px] leading-[1.15] font-extrabold tracking-tight">
        {habit.title}
      </p>
      <p className="text-[11px] leading-tight font-bold text-ink-soft">
        {habit.doneToday ? (
          <span className="rounded-pill bg-lime px-2 py-0.5 text-ink">Done today</span>
        ) : slipping ? (
          <span className="text-ink">Slipping, do it today</span>
        ) : (
          `${habit.currentStreak} day streak`
        )}
      </p>
    </Link>
  );
}

/** Compact strip of habit summaries on Home. Each links to its habit; "See all" opens the page. */
export function HabitStrip({ habits }: HabitStripProps) {
  if (habits.items.length === 0) {
    const pct =
      habits.firstHabitsProgress === null ? null : Math.round(habits.firstHabitsProgress * 100);
    return (
      <section aria-label="Your habits">
        <Header />
        <Link
          href="/habits"
          className="flex items-center gap-3 rounded-[20px] bg-paper p-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          <GameObject name="sprout" size={44} float />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold">Your first habits are forming…</p>
            <p className="mt-0.5 text-[12px] font-semibold text-ink-soft">
              No habits yet{pct !== null ? `, ${pct}% there` : ""}. View habits
            </p>
            {pct !== null && (
              <div
                role="progressbar"
                aria-label="First habits progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="mt-2 h-2 overflow-hidden rounded-pill bg-muted"
              >
                <span className="block h-full rounded-pill bg-lav-ink" style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
            )}
          </div>
        </Link>
      </section>
    );
  }
  return (
    <section aria-label="Your habits">
      <Header />
      <ul className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {habits.items.map((h) => (
          <li key={h.key} className="flex">
            <StripCard habit={h} />
          </li>
        ))}
      </ul>
    </section>
  );
}
