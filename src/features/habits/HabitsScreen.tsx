"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import {
  AnimatedCheck,
  BracketHeadline,
  Card,
  GameObject,
  Rise,
  Stagger,
  ThemeColor,
  cn,
} from "@/components/ui";
import { useCelebrate } from "@/features/celebrations";
import type { CelebrationEvent } from "@/lib/celebrations";
import { habitObject } from "@/lib/habit-icons";
import type { Habit } from "@/lib/types";
import { scheduleLabel, toneFor } from "./tones";

export type CheckInResponse =
  | { ok: true; xpEarned: number; streak: number; celebrations?: readonly CelebrationEvent[] }
  | { ok: false; error: string };

export interface HabitsScreenProps {
  habits: readonly Habit[];
  onCheckIn: (habitId: string) => Promise<CheckInResponse>;
}

function Plus() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function HabitsScreen({ habits, onCheckIn }: HabitsScreenProps) {
  const celebrate = useCelebrate();
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(habits.filter((h) => h.doneToday).map((h) => h.id)),
  );
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [floating, setFloating] = useState<{ id: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = habits.filter((h) => h.scheduledToday);
  const later = habits.filter((h) => !h.scheduledToday);
  const doneCount = today.filter((h) => checked.has(h.id)).length;
  const pct = today.length ? Math.round((doneCount / today.length) * 100) : 0;

  const rollBack = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const toggle = async (id: string) => {
    if (checked.has(id)) return;
    setChecked((prev) => new Set([...prev, id]));
    setError(null);
    try {
      const res = await onCheckIn(id);
      if (!res.ok) {
        rollBack(id);
        setError(res.error);
        return;
      }
      setStreaks((s) => ({ ...s, [id]: res.streak }));
      setFloating({ id, text: `+${res.xpEarned} XP` });
      window.setTimeout(() => setFloating((f) => (f?.id === id ? null : f)), 1400);
      if (res.celebrations?.length) window.setTimeout(() => celebrate(res.celebrations ?? []), 900);
    } catch (err) {
      rollBack(id);
      setError(err instanceof Error ? err.message : "Failed to check in");
    }
  };

  const row = (habit: Habit, i: number, canCheck: boolean) => {
    const isDone = checked.has(habit.id);
    const streak = streaks[habit.id] ?? habit.currentStreak;
    return (
      <li
        key={habit.id}
        className="relative flex items-center gap-3 rounded-[18px] bg-paper p-3"
      >
        <Link
          href={`/habits/${habit.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          <span
            aria-hidden="true"
            className={cn("grid size-11 flex-none place-items-center rounded-xl", toneFor(i))}
          >
            <GameObject name={habitObject(habit.icon)} size={32} />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[15px]">{habit.title}</b>
            <small className="block truncate text-xs font-semibold text-ink-soft">
              {canCheck ? scheduleLabel(habit.daysOfWeek) : `Next: ${scheduleLabel(habit.daysOfWeek)}`}
            </small>
          </span>
        </Link>
        <span className="inline-flex flex-none items-center gap-0.5 rounded-pill bg-cream py-0.5 pr-2.5 pl-0.5 text-[13px] font-extrabold">
          <GameObject name="flame" size={22} />
          <span aria-hidden="true">{streak}</span>
          <span className="sr-only">{streak} day streak</span>
        </span>
        {canCheck ? (
          <span className="relative -m-1.5 grid size-11 flex-none place-items-center">
            <input
              type="checkbox"
              aria-label={`Check in: ${habit.title}`}
              checked={isDone}
              disabled={isDone}
              onChange={() => toggle(habit.id)}
              className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-default"
            />
            <motion.span
              animate={isDone ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn(
                "grid size-[30px] place-items-center rounded-full border-2 border-ink transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lav-ink",
                isDone && "bg-ink",
              )}
            >
              {isDone && <AnimatedCheck className="size-4 text-lime" />}
            </motion.span>
            <AnimatePresence>
              {floating?.id === habit.id && (
                <motion.span
                  key={floating.text}
                  role="status"
                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                  animate={{ opacity: 1, y: -34, scale: 1 }}
                  exit={{ opacity: 0, y: -52 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="pointer-events-none absolute -top-1 right-0 z-20 rounded-pill bg-lime px-2.5 py-1 text-xs leading-none font-extrabold whitespace-nowrap"
                >
                  {floating.text}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        ) : null}
      </li>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <ThemeColor color="cream" />
      <main className="px-gutter pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">
              Habit mode
            </p>
            <BracketHeadline size="h1" className="mt-1.5">
              {"Small habits,\n[big wins]"}
            </BracketHeadline>
          </div>
          <Link
            href="/habits/new"
            className="mt-1 inline-flex min-h-11 flex-none items-center gap-1.5 rounded-pill bg-ink px-4 text-[14px] font-extrabold text-cream transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
          >
            <Plus />
            New
          </Link>
        </div>

        {habits.length === 0 ? (
          <Rise>
            <Card tone="lav" padding="lg" className="mt-6 flex flex-col items-center gap-3 text-center">
              <GameObject name="sparkle" size={96} float />
              <h2 className="text-[22px] leading-tight font-extrabold tracking-tight">
                No habits yet
              </h2>
              <p className="text-sm font-medium text-ink/75">
                Pick one small thing and do it every day. The streak does the rest.
              </p>
              <Link
                href="/habits/new"
                className="inline-flex min-h-12 items-center rounded-pill bg-ink px-6 text-[15px] font-extrabold text-cream active:scale-95"
              >
                Add your first habit
              </Link>
            </Card>
          </Rise>
        ) : (
          <Stagger className="mt-5 flex flex-col gap-5">
            <Rise>
              <Card tone="lime" padding="md" className="flex items-center gap-4">
                <GameObject name="target" size={56} className="flex-none" />
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] leading-none font-extrabold tracking-tight">
                    {today.length ? `${doneCount}/${today.length} done today` : "Rest day"}
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Habits done today"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    className="mt-2.5 h-3 overflow-hidden rounded-pill bg-ink/15"
                  >
                    <motion.div
                      className="h-full rounded-pill bg-ink"
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-ink/70">
                    {today.length && doneCount === today.length
                      ? "All done. Nice work!"
                      : "Tick them off to keep your streaks alive."}
                  </p>
                </div>
              </Card>
            </Rise>

            {error && (
              <div role="alert" className="rounded-[14px] bg-red/20 px-3 py-2 text-sm font-medium">
                {error}
              </div>
            )}

            {today.length > 0 && (
              <Rise>
                <section aria-label="Today">
                  <h2 className="mb-2.5 text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">
                    Today
                  </h2>
                  <ul className="flex flex-col gap-2">{today.map((h, i) => row(h, i, true))}</ul>
                </section>
              </Rise>
            )}

            {later.length > 0 && (
              <Rise>
                <section aria-label="Not scheduled today">
                  <h2 className="mb-2.5 text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">
                    Not today
                  </h2>
                  <ul className="flex flex-col gap-2 opacity-80">
                    {later.map((h, i) => row(h, i + today.length, false))}
                  </ul>
                </section>
              </Rise>
            )}
          </Stagger>
        )}
      </main>
    </MotionConfig>
  );
}
