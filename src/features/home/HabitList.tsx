"use client";

import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { GameObject } from "@/components/ui/GameObject";
import { AnimatedCheck } from "@/components/ui/Motion";
import { useCelebrate } from "@/features/celebrations";
import type { CelebrationEvent } from "@/lib/celebrations";
import { habitObject } from "@/lib/habit-icons";
import type { Habit } from "@/lib/types";
import { SectionHead } from "./SectionHead";

export interface HabitListProps {
  habits: readonly Habit[];
  onCheckIn: (
    habitId: string,
  ) => Promise<
    | { ok: true; xpEarned: number; streak: number; celebrations?: readonly CelebrationEvent[] }
    | { ok: false; error: string }
  >;
}

const TONES = ["bg-peach", "bg-sky", "bg-lav", "bg-lime"] as const;

export function HabitList({ habits, onCheckIn }: HabitListProps) {
  const celebrate = useCelebrate();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set(habits.filter((h) => h.doneToday).map((h) => h.id)),
  );
  const [error, setError] = useState<string | null>(null);
  /** Habit whose "+N XP" is currently floating up from its tick. */
  const [floating, setFloating] = useState<{ id: string; text: string } | null>(
    null,
  );
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  const rollBack = (habitId: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(habitId);
      return next;
    });

  const handleToggle = async (habitId: string) => {
    if (checkedIds.has(habitId)) return;

    // Optimistically mark done.
    setCheckedIds((prev) => new Set([...prev, habitId]));
    setError(null);

    try {
      const res = await onCheckIn(habitId);
      if (!res.ok) {
        rollBack(habitId);
        setError(res.error);
        return;
      }
      setStreaks((s) => ({ ...s, [habitId]: res.streak }));
      if (res.celebrations?.length) window.setTimeout(() => celebrate(res.celebrations ?? []), 900);
      setFloating({ id: habitId, text: `+${res.xpEarned} XP` });
      window.setTimeout(
        () => setFloating((f) => (f?.id === habitId ? null : f)),
        1400,
      );
    } catch (err) {
      rollBack(habitId);
      setError(err instanceof Error ? err.message : "Failed to check in");
    }
  };

  const doneCount = habits.filter((h) => checkedIds.has(h.id)).length;

  return (
    <section aria-label="Today's habits">
      <SectionHead
        title="Small habits, [big wins]"
        note={habits.length ? `${doneCount} / ${habits.length}` : undefined}
      />
      {error && (
        <div
          role="alert"
          className="mb-2 rounded-[14px] bg-red/20 px-3 py-2 text-sm font-medium"
        >
          {error}
        </div>
      )}
      {habits.length === 0 ? (
        <Card
          tone="paper"
          className="flex flex-col items-center gap-2 rounded-[18px] text-center"
        >
          <p className="text-sm text-ink-soft">No habits yet</p>
          <Link
            href="/habits"
            className="inline-flex min-h-11 items-center rounded-pill bg-ink px-5 text-sm font-bold text-cream"
          >
            View habits
          </Link>
        </Card>
      ) : (
        <MotionConfig reducedMotion="user">
          <ul className="flex flex-col gap-2">
            {habits.map((habit, i) => {
              const isDone = checkedIds.has(habit.id);
              const streak = streaks[habit.id] ?? habit.currentStreak;
              return (
                <li
                  key={habit.id}
                  className="relative flex items-center gap-3 rounded-[18px] bg-paper p-3"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-10 flex-none place-items-center rounded-xl",
                      TONES[i % TONES.length],
                    )}
                  >
                    <GameObject name={habitObject(habit.icon)} size={30} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`habit-${habit.id}`}
                      className="block truncate text-[15px] font-bold"
                    >
                      {habit.title}
                    </label>
                    <small className="text-xs text-ink-soft">
                      {streak} day streak
                    </small>
                  </div>
                  <span className="relative -m-1.5 grid size-11 flex-none place-items-center">
                    <input
                      id={`habit-${habit.id}`}
                      type="checkbox"
                      aria-label={habit.title}
                      checked={isDone}
                      disabled={isDone}
                      onChange={() => handleToggle(habit.id)}
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
                </li>
              );
            })}
          </ul>
        </MotionConfig>
      )}
    </section>
  );
}
