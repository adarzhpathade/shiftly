import Link from "next/link";
import {
  AnimatedCheck,
  GameObject,
  Heatmap,
  MasteryRing,
  StageBadge,
  cn,
  type RingTone,
} from "@/components/ui";
import { habitObject } from "@/lib/habit-icons";
import type { DetectedHabit, HabitStage } from "@/lib/types";
import { formatDays, formatWindow, slippingNudge, streakText } from "./format";

const RING_TONE: Record<HabitStage, RingTone> = {
  forming: "lav-ink",
  building: "flame",
  solid: "xp-gold",
};

export const OBJECT_TILE: Record<HabitStage, string> = {
  forming: "bg-lime/60",
  building: "bg-peach",
  solid: "bg-sky",
};

export interface HabitCardProps {
  habit: DetectedHabit;
}

/** One detected habit: object, usual days and time, stage, streak, consistency ring, heatmap. */
export function HabitCard({ habit }: HabitCardProps) {
  const slipping = habit.status === "slipping";
  return (
    <Link
      href={`/habits/${encodeURIComponent(habit.key)}`}
      className="block rounded-card bg-paper p-3.5 transition-transform duration-300 ease-spring active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-[52px] flex-none place-items-center rounded-[18px]",
            OBJECT_TILE[habit.stage],
          )}
        >
          <GameObject name={habitObject(habit.icon)} size={40} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] leading-[1.1] font-extrabold tracking-tight">{habit.title}</h3>
          <p className="mt-1 text-[12px] leading-snug font-semibold text-ink-soft">
            {formatDays(habit.usualDays)} · {formatWindow(habit.usualWindow)}
          </p>
        </div>
        <MasteryRing
          value={habit.consistency * 100}
          tone={RING_TONE[habit.stage]}
          size={52}
          strokeWidth={6}
          label={`${habit.title} consistency`}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <StageBadge stage={habit.stage} size="sm" />
        <span className="inline-flex items-center gap-0.5 text-[12px] font-extrabold">
          <GameObject name="flame" size={18} />
          {streakText(habit.currentStreak)}
        </span>
        {habit.doneToday && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-pill bg-lime px-2 py-1 text-[11px] leading-none font-extrabold">
            <AnimatedCheck className="size-3.5" />
            Done today
          </span>
        )}
      </div>

      <Heatmap cells={habit.heatmap} variant="row" days={21} className="mt-3" />

      {slipping && (
        <p className="mt-3 rounded-[12px] bg-peach/60 px-3 py-2 text-[13px] leading-snug font-bold text-ink">
          {slippingNudge(habit)}
        </p>
      )}
    </Link>
  );
}
