"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  Avatar,
  BracketHeadline,
  Chip,
  GameObject,
  MasteryRing,
  Rise,
  Stagger,
  ThemeColor,
  cn,
  type BuddyKey,
  type GameObjectName,
} from "@/components/ui";
import { habitObject } from "@/lib/habit-icons";
import type {
  CoachNote,
  FirstHabitsProgress,
  HabitInsights,
  HabitsOverview,
  NextHabitSuggestion,
} from "@/lib/types";
import { HabitCard } from "./HabitCard";
import { WEEKDAY_SHORT } from "./format";

export interface HabitsScreenProps {
  overview: HabitsOverview;
  /** The user's buddy for the coach note. Defaults to Ace. */
  buddy?: BuddyKey;
  /**
   * Optional: the faded habits, when the data layer can list them. The contract only counts
   * them (`fadingCount`), so without this the "N faded" line explains instead of listing.
   */
  fadedHabits?: readonly { key: string; title: string }[];
}

function CoachNoteCard({ note, buddy }: { note: CoachNote; buddy: BuddyKey }) {
  return (
    <section aria-label="Weekly coach note" className="rounded-card bg-lav p-4">
      <div className="flex items-center gap-2.5">
        <Avatar name="Your coach buddy" avatarKey={buddy} size="md" tone="paper" />
        <Chip tone="paper">This week</Chip>
        {note.source === "rules" && (
          <span className="ml-auto rounded-pill bg-paper/60 px-2 py-1 text-[10px] leading-none font-bold tracking-[0.04em] text-ink-soft uppercase">
            Rules-based
          </span>
        )}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {note.lines.map((line) => (
          <li key={line} className="flex gap-2 text-[14px] leading-snug font-bold">
            <span aria-hidden="true" className="mt-[7px] size-1.5 flex-none rounded-full bg-ink" />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DayChips({ days }: { days: readonly number[] }) {
  return (
    <ul className="flex gap-1.5" aria-label="Suggested days">
      {WEEKDAY_SHORT.map((label, i) => {
        const on = days.includes(i + 1);
        return (
          <li
            key={label}
            className={cn(
              "grid h-7 flex-1 place-items-center rounded-pill text-[11px] font-extrabold",
              on ? "bg-ink text-cream" : "bg-paper/60 text-ink-soft",
            )}
          >
            {label.slice(0, 2)}
          </li>
        );
      })}
    </ul>
  );
}

function NextHabitCard({ next }: { next: NextHabitSuggestion }) {
  const name: GameObjectName = habitObject(next.icon);
  return (
    <section aria-label="Next habit to form" className="rounded-card bg-sky p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-[52px] flex-none place-items-center rounded-[18px] bg-paper/70">
          <GameObject name={name} size={40} float />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink-soft">
            Next habit to form
          </p>
          <h3 className="mt-0.5 text-[17px] leading-[1.1] font-extrabold tracking-tight">{next.title}</h3>
        </div>
      </div>
      <p className="mt-2.5 text-[13px] leading-snug font-semibold">{next.reason}</p>
      <div className="mt-3">
        <DayChips days={next.suggestedDays} />
      </div>
      <div className="mt-3.5">
        <div className="mb-1 flex items-baseline justify-between text-[12px] font-extrabold">
          <span>Getting there</span>
          <span>
            {next.occurrences} of {next.needed} days
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progress toward forming this habit"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(next.progress * 100)}
          className="h-2.5 overflow-hidden rounded-pill bg-paper/70"
        >
          <span
            className="block h-full rounded-pill bg-ink transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(4, next.progress * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function FirstHabits({ first }: { first: FirstHabitsProgress }) {
  return (
    <section aria-label="Your first habits" className="flex flex-col items-center rounded-card bg-paper px-4 py-6 text-center">
      <BracketHeadline size="h2">{"Your first habits\nare [forming…]"}</BracketHeadline>
      <div className="relative mt-5">
        <MasteryRing
          value={first.progress * 100}
          tone="lav-ink"
          size={168}
          strokeWidth={16}
          label="First habit progress"
        >
          <span className="flex flex-col items-center leading-none">
            <span className="text-[34px] font-extrabold tracking-tight">
              {first.occurrences}/{first.needed}
            </span>
            <span className="mt-1 text-[12px] font-bold text-ink-soft">days</span>
          </span>
        </MasteryRing>
        <GameObject name="sprout" size={52} float className="absolute -top-3 -right-5" />
      </div>
      <p className="mt-4 max-w-[28ch] text-[15px] leading-snug font-bold">{first.hint}</p>
      <p className="mt-1.5 max-w-[32ch] text-[13px] leading-snug font-semibold text-ink-soft">
        Do something on 3 different days within 2 weeks and the app turns it into a habit.
      </p>
    </section>
  );
}

const INSIGHT_META: Record<
  keyof HabitInsights,
  { title: string; object: GameObjectName; tone: string }
> = {
  bestTimeOfDay: { title: "Best time", object: "calendar", tone: "bg-peach" },
  mostSkippedWeekday: { title: "Most skipped", object: "cloud", tone: "bg-sky" },
  skillLink: { title: "Skill link", object: "rocket", tone: "bg-lime/60" },
  streakAtRisk: { title: "Streak at risk", object: "flame", tone: "bg-lav" },
};

function Insights({ insights }: { insights: HabitInsights }) {
  const items = (Object.keys(INSIGHT_META) as (keyof HabitInsights)[]).flatMap((key) => {
    const v = insights[key];
    return v ? [{ key, text: v.text }] : [];
  });
  if (items.length === 0) return null;
  return (
    <section aria-label="Your patterns">
      <BracketHeadline as="h2" size="h3" className="mb-2.5">
        {"Your [patterns]"}
      </BracketHeadline>
      <ul className="grid grid-cols-2 gap-2.5">
        {items.map((it, i) => {
          const meta = INSIGHT_META[it.key];
          const lastOdd = items.length % 2 === 1 && i === items.length - 1;
          return (
            <li
              key={it.key}
              className={cn("rounded-[20px] p-3", meta.tone, lastOdd && "col-span-2")}
            >
              <div className="flex items-center gap-1.5">
                <GameObject name={meta.object} size={28} />
                <h3 className="text-[12px] font-extrabold tracking-[0.02em]">{meta.title}</h3>
              </div>
              <p className="mt-1.5 text-[13px] leading-snug font-semibold">{it.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FadedLine({
  count,
  habits,
}: {
  count: number;
  habits?: readonly { key: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (count <= 0) return null;
  return (
    <section aria-label="Faded habits" className="rounded-[18px] bg-paper/70 px-4 py-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between text-[14px] font-bold text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
      >
        <span>{count} faded</span>
        <span aria-hidden="true" className={cn("transition-transform duration-300", open && "rotate-180")}>
          ▾
        </span>
      </button>
      <div id={panelId} hidden={!open} className="pb-3">
        <p className="text-[13px] leading-snug font-semibold text-ink-soft">
          {count === 1 ? "A habit has" : `${count} habits have`} gone quiet for two weeks or more. Do it on 3
          different days and it comes back.
        </p>
        {habits && habits.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {habits.map((h) => (
              <li key={h.key}>
                <Link
                  href={`/habits/${encodeURIComponent(h.key)}`}
                  className="inline-flex min-h-9 items-center text-[14px] font-extrabold text-lav-ink underline underline-offset-4"
                >
                  {h.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** "Habits the app spots": fully automatic, so nothing here adds, edits or checks in a habit. */
export function HabitsScreen({ overview, buddy = "buddy-2", fadedHabits }: HabitsScreenProps) {
  const { habits, fadingCount, nextHabit, insights, coachNote, firstHabits } = overview;
  return (
    <main className="mx-auto w-full max-w-md overflow-x-clip px-4 pt-[18px] pb-6">
      <ThemeColor color="cream" />
      <Stagger className="flex flex-col gap-[22px]" gap={0.07}>
        <Rise>
          <header>
            <p className="text-[12px] font-bold tracking-[0.08em] text-ink-soft uppercase">
              Habits the app spots
            </p>
            <BracketHeadline size="h1" className="mt-1">
              {"[your habits]"}
            </BracketHeadline>
            <p className="mt-2 text-[14px] leading-snug font-semibold text-ink-soft">
              We notice what you do and turn it into habits.
            </p>
          </header>
        </Rise>

        <Rise>
          <CoachNoteCard note={coachNote} buddy={buddy} />
        </Rise>

        {habits.length > 0 ? (
          <Rise>
            <section aria-label="Your habits">
              <ul className="flex flex-col gap-3">
                {habits.map((h) => (
                  <li key={h.key}>
                    <HabitCard habit={h} />
                  </li>
                ))}
              </ul>
            </section>
          </Rise>
        ) : firstHabits ? (
          <Rise>
            <FirstHabits first={firstHabits} />
          </Rise>
        ) : (
          <Rise>
            <section className="rounded-card bg-paper p-5 text-center">
              <BracketHeadline size="h2">{"Your first habits\nare [forming…]"}</BracketHeadline>
              <p className="mt-2 text-[14px] font-semibold text-ink-soft">
                Keep training and they will show up here.
              </p>
            </section>
          </Rise>
        )}

        {nextHabit && (
          <Rise>
            <NextHabitCard next={nextHabit} />
          </Rise>
        )}

        <Rise>
          <Insights insights={insights} />
        </Rise>

        <Rise>
          <FadedLine count={fadingCount} habits={fadedHabits} />
        </Rise>
      </Stagger>
    </main>
  );
}
