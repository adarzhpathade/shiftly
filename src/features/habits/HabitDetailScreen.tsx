"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BracketHeadline,
  Button,
  Card,
  GameObject,
  Pop,
  Rise,
  ShakeText,
  Stagger,
  ThemeColor,
  cn,
} from "@/components/ui";
import { habitObject } from "@/lib/habit-icons";
import type { HabitDetail } from "@/lib/types";
import { MonthHeatmap } from "./MonthHeatmap";
import { scheduleLabel } from "./tones";

export type DeleteResponse = { ok: true } | { ok: false; error: string };

export interface HabitDetailScreenProps {
  habit: HabitDetail;
  onDelete: (habitId: string) => Promise<DeleteResponse>;
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

export function HabitDetailScreen({ habit, onDelete }: HabitDetailScreenProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, deleting]);

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await onDelete(habit.id);
      if (res.ok) {
        router.replace("/habits");
        router.refresh();
        return;
      }
      setError(res.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the habit");
    }
    setDeleting(false);
  };

  const pct = Math.round(habit.completionRate * 100);
  const doneDays = habit.heatmap.filter((d) => d.done).map((d) => d.date).reverse();
  const notes = new Map(habit.notes.map((n) => [n.date, n.text]));
  const recent = doneDays.slice(0, 6);

  const sheetBtn =
    "inline-flex min-h-12 w-full items-center justify-center rounded-pill px-6 text-[15px] font-extrabold transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink";

  return (
    <MotionConfig reducedMotion="user">
      <ThemeColor color="cream" />
      <main className="px-gutter pt-6">
        <Link
          href="/habits"
          className="inline-flex min-h-11 items-center gap-1 rounded-pill pr-3 text-[14px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Habits
        </Link>

        <Stagger className="mt-2 flex flex-col gap-4">
          <Rise>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-14 flex-none place-items-center rounded-[18px] bg-peach">
                <GameObject name={habitObject(habit.icon)} size={42} />
              </span>
              <div className="min-w-0">
                <BracketHeadline size="h2" as="h1" className="break-words">
                  {habit.title}
                </BracketHeadline>
                <p className="mt-0.5 text-[13px] font-semibold text-ink-soft">
                  {scheduleLabel(habit.daysOfWeek)}
                  {habit.reminderTime ? ` · Reminder ${habit.reminderTime}` : ""}
                </p>
              </div>
            </div>
          </Rise>

          <Pop>
            <Card tone="lime" padding="lg" className="flex items-center gap-4">
              <GameObject name="flame" size={96} float className="flex-none" />
              <div>
                <p className="text-[64px] leading-[0.9] font-extrabold tracking-[-0.04em]" aria-label={`${habit.currentStreak} day streak`}>
                  {habit.currentStreak}
                </p>
                <p className="mt-1 text-[15px] font-extrabold">day streak</p>
              </div>
            </Card>
          </Pop>

          <Rise>
            <div className="grid grid-cols-2 gap-3">
              <Card tone="sky" padding="md">
                <p className="text-[28px] leading-none font-extrabold tracking-tight">{habit.bestStreak}</p>
                <p className="mt-1 text-[13px] font-bold text-ink/75">Best streak</p>
              </Card>
              <Card tone="peach" padding="md">
                <p className="text-[28px] leading-none font-extrabold tracking-tight">{pct}%</p>
                <p className="mt-1 text-[13px] font-bold text-ink/75">Completion</p>
              </Card>
            </div>
          </Rise>

          <Rise>
            <MonthHeatmap days={habit.heatmap} />
          </Rise>

          <Rise>
            <section aria-label="Recent check-ins" className="rounded-card bg-paper p-4">
              <h2 className="text-[17px] font-extrabold tracking-tight">Recent log</h2>
              {recent.length === 0 ? (
                <p className="mt-2 text-sm font-medium text-ink-soft">No check-ins yet. Today is a good day to start.</p>
              ) : (
                <ul className="mt-2 flex flex-col divide-y divide-muted">
                  {recent.map((date) => (
                    <li key={date} className="flex items-baseline justify-between gap-3 py-2.5">
                      <span className="text-[14px] font-bold">{formatDay(date)}</span>
                      <span className="min-w-0 truncate text-[13px] font-medium text-ink-soft">
                        {notes.get(date) ?? "Checked in"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Rise>

          <Rise className="flex flex-col gap-2 pb-2">
            <Link href={`/habits/${habit.id}/edit`} className={cn(sheetBtn, "bg-ink text-cream")}>
              Edit habit
            </Link>
            <button type="button" onClick={() => setConfirming(true)} className={cn(sheetBtn, "text-red underline underline-offset-4")}>
              Delete habit
            </button>
          </Rise>
        </Stagger>
      </main>

      <AnimatePresence>
        {confirming && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-end bg-ink/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setConfirming(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              className="mx-auto w-full max-w-md rounded-t-[28px] bg-cream p-5 pb-8"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-10 rounded-pill bg-muted" />
              <h2 id="delete-title" className="text-[22px] leading-tight font-extrabold tracking-tight">
                Delete this habit?
              </h2>
              <p className="mt-1.5 text-[14px] font-medium text-ink-soft">
                &ldquo;{habit.title}&rdquo; and its {habit.currentStreak} day streak will be gone. This cannot be undone.
              </p>
              {error && (
                <ShakeText role="alert" className="mt-3 rounded-card bg-paper p-3 text-center text-[14px] font-bold text-red">
                  {error}
                </ShakeText>
              )}
              <div className="mt-5 flex flex-col gap-2">
                <Button variant="ink" size="lg" fullWidth onClick={confirmDelete} loading={deleting} className="bg-red text-paper">
                  Yes, delete
                </Button>
                <button type="button" onClick={() => setConfirming(false)} disabled={deleting} className={cn(sheetBtn, "bg-paper")}>
                  Keep it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
