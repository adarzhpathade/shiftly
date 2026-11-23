"use client";

import Link from "next/link";
import {
  BracketHeadline,
  GameObject,
  Heatmap,
  MasteryRing,
  Rise,
  Stagger,
  StageBadge,
  ThemeColor,
  cn,
} from "@/components/ui";
import { habitObject } from "@/lib/habit-icons";
import type { HabitDetail } from "@/lib/types";
import { OBJECT_TILE } from "./HabitCard";
import {
  STAGE_LABEL,
  formatDays,
  formatShortDate,
  formatWhen,
  formatWindow,
  slippingNudge,
} from "./format";

export interface HabitDetailScreenProps {
  habit: HabitDetail;
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-[20px] bg-paper px-3 py-3 text-center">
      <p className="text-[26px] leading-none font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] leading-tight font-bold text-ink-soft">
        {label}
        <span className="sr-only"> {unit}</span>
      </p>
    </div>
  );
}

function WeeklyBars({ weeks }: { weeks: HabitDetail["weeklyCounts"] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  return (
    <div>
      <ul
        aria-label="Times per week, last 12 weeks"
        className="flex h-24 items-end gap-1.5"
      >
        {weeks.map((w) => (
          <li
            key={w.weekStart}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
            title={`Week of ${formatShortDate(w.weekStart)}: ${w.count}`}
          >
            <span className="mb-0.5 text-center text-[10px] leading-none font-bold text-ink-soft">
              {w.count > 0 ? w.count : ""}
            </span>
            <span
              className={cn(
                "block w-full rounded-t-[6px] rounded-b-[3px]",
                w.count > 0 ? "bg-lav-ink" : "bg-muted",
              )}
              style={{ height: `${Math.max(6, (w.count / max) * 100)}%`, maxHeight: "calc(100% - 14px)" }}
            />
            <span className="sr-only">
              Week of {formatShortDate(w.weekStart)}: {w.count}
            </span>
          </li>
        ))}
      </ul>
      {first && last && (
        <div aria-hidden="true" className="mt-1.5 flex justify-between text-[10px] font-bold text-ink-soft">
          <span>{formatShortDate(first.weekStart)}</span>
          <span>{formatShortDate(last.weekStart)}</span>
        </div>
      )}
    </div>
  );
}

/** One habit in detail: 12-week heatmap, weekly counts, recent occurrences, status, next stage. */
export function HabitDetailScreen({ habit }: HabitDetailScreenProps) {
  const slipping = habit.status === "slipping";
  const fading = habit.status === "fading";
  return (
    <main className="mx-auto w-full max-w-md overflow-x-clip px-4 pt-[14px] pb-8">
      <ThemeColor color="cream" />
      <Stagger className="flex flex-col gap-4" gap={0.06}>
        <Rise>
          <Link
            href="/habits"
            className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-extrabold text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
          >
            <span aria-hidden="true">←</span> All habits
          </Link>
        </Rise>

        <Rise>
          <header className="flex items-start gap-3.5">
            <span
              className={cn(
                "grid size-[72px] flex-none place-items-center rounded-[24px]",
                OBJECT_TILE[habit.stage],
              )}
            >
              <GameObject name={habitObject(habit.icon)} size={56} float />
            </span>
            <div className="min-w-0">
              <BracketHeadline size="h2" className="break-words">
                {habit.title}
              </BracketHeadline>
              <p className="mt-1.5 text-[13px] leading-snug font-semibold text-ink-soft">
                {formatDays(habit.usualDays)} · {formatWindow(habit.usualWindow)}
              </p>
            </div>
          </header>
        </Rise>

        <Rise>
          <p className="text-[14px] leading-snug font-semibold">{habit.description}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StageBadge stage={habit.stage} />
            {habit.doneToday && (
              <span className="rounded-pill bg-lime px-2.5 py-1 text-[12px] leading-none font-extrabold">
                Done today
              </span>
            )}
            {slipping && (
              <span className="rounded-pill bg-peach px-2.5 py-1 text-[12px] leading-none font-extrabold">
                Slipping
              </span>
            )}
            {fading && (
              <span className="rounded-pill bg-muted px-2.5 py-1 text-[12px] leading-none font-extrabold">
                Faded
              </span>
            )}
          </div>
        </Rise>

        {(habit.statusNote || slipping) && (
          <Rise>
            <section
              aria-label="Status"
              className="rounded-card bg-peach/60 p-4 text-[14px] leading-snug font-bold"
            >
              {habit.statusNote ?? slippingNudge(habit)}
            </section>
          </Rise>
        )}

        <Rise>
          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="Current streak" value={habit.currentStreak} unit="days" />
            <Stat label="Best streak" value={habit.bestStreak} unit="days" />
            <div className="grid place-items-center rounded-[20px] bg-paper px-2 py-2">
              <MasteryRing
                value={habit.consistency * 100}
                tone="lav-ink"
                size={60}
                strokeWidth={7}
                label="Consistency"
              />
              <p className="text-[11px] leading-tight font-bold text-ink-soft">Consistency</p>
            </div>
          </div>
        </Rise>

        <Rise>
          <section aria-label="Last 12 weeks" className="rounded-card bg-paper p-4">
            <h2 className="mb-3 text-[15px] font-extrabold tracking-tight">Last 12 weeks</h2>
            <Heatmap cells={habit.heatmap} variant="grid" />
            <div
              aria-hidden="true"
              className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-bold text-ink-soft"
            >
              Less
              <span className="size-3 rounded-[4px] bg-muted" />
              <span className="size-3 rounded-[4px] bg-lav" />
              <span className="size-3 rounded-[4px] bg-lav-ink/75" />
              <span className="size-3 rounded-[4px] bg-lav-ink" />
              More
            </div>
          </section>
        </Rise>

        <Rise>
          <section aria-label="Weekly counts" className="rounded-card bg-paper p-4">
            <h2 className="mb-3 text-[15px] font-extrabold tracking-tight">Times per week</h2>
            <WeeklyBars weeks={habit.weeklyCounts} />
          </section>
        </Rise>

        {habit.nextStage && (
          <Rise>
            <section aria-label="Next stage" className="rounded-card bg-sky p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-extrabold tracking-tight">Next stage</h2>
                <StageBadge stage={habit.nextStage.stage} size="sm" />
              </div>
              <div
                role="progressbar"
                aria-label={`Progress toward ${STAGE_LABEL[habit.nextStage.stage]}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(habit.nextStage.progress * 100)}
                className="mt-3 h-2.5 overflow-hidden rounded-pill bg-paper/70"
              >
                <span
                  className="block h-full rounded-pill bg-ink"
                  style={{ width: `${Math.max(4, habit.nextStage.progress * 100)}%` }}
                />
              </div>
              <p className="mt-2.5 text-[13px] leading-snug font-semibold">{habit.nextStage.hint}</p>
            </section>
          </Rise>
        )}

        <Rise>
          <section aria-label="Recent" className="rounded-card bg-paper p-4">
            <h2 className="mb-1 text-[15px] font-extrabold tracking-tight">Recently</h2>
            {habit.recent.length === 0 ? (
              <p className="text-[13px] font-semibold text-ink-soft">Nothing logged yet.</p>
            ) : (
              <ul className="divide-y divide-muted">
                {habit.recent.map((o) => (
                  <li key={o.at} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="text-[14px] leading-snug font-bold">{o.label}</span>
                    <span className="flex-none text-[12px] font-semibold text-ink-soft">
                      {formatWhen(o.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Rise>
      </Stagger>
    </main>
  );
}
