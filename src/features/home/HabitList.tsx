"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { AnimatedCheck } from "@/components/ui/Motion";
import type { Habit } from "@/lib/types";

export interface HabitListProps {
  habits: readonly Habit[];
  onCheckIn: (
    habitId: string
  ) => Promise<
    | { ok: true; xpEarned: number; streak: number }
    | { ok: false; error: string }
  >;
}

const TONES = ["bg-peach", "bg-sky", "bg-lav", "bg-lime"] as const;
const ICONS: Record<string, string> = {
  clock: "⏰",
  chat: "💬",
  phone: "📞",
  smile: "😊",
  book: "📖",
  target: "🎯",
};

export function HabitList({ habits, onCheckIn }: HabitListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set(habits.filter((h) => h.doneToday).map((h) => h.id))
  );
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleToggle = async (habitId: string) => {
    if (checkedIds.has(habitId)) return;

    // Optimistically mark done
    setCheckedIds((prev) => new Set([...prev, habitId]));
    setError(null);

    try {
      const res = await onCheckIn(habitId);
      if (!res.ok) {
        // Roll back
        setCheckedIds((prev) => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
        setError(res.error);
      } else {
        setFeedback(`+${res.xpEarned} XP`);
      }
    } catch (err) {
      // Roll back
      setCheckedIds((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
      setError(err instanceof Error ? err.message : "Failed to check in");
    }
  };

  return (
    <section aria-labelledby="habits-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="habits-heading" className="text-lg font-extrabold">
          Today&apos;s Habits
        </h2>
        {feedback && (
          <motion.div
            key={feedback + checkedIds.size}
            aria-live="polite"
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}
            className="rounded-pill bg-lime px-3 py-1 text-sm font-extrabold"
          >
            {feedback}
          </motion.div>
        )}
      </div>
      {error && (
        <div role="alert" className="rounded-xl bg-red/20 px-3 py-2 text-sm font-medium">
          {error}
        </div>
      )}
      {habits.length === 0 ? (
        <Card tone="paper" className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-ink-soft">No habits yet</p>
          <a href="/habits" className="inline-flex min-h-11 items-center rounded-pill bg-ink px-5 text-sm font-bold text-cream">
            View habits
          </a>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {habits.map((habit, i) => {
            const isDone = checkedIds.has(habit.id);
            return (
              <li
                key={habit.id}
                className="flex items-center gap-3 rounded-[18px] bg-paper p-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-10 flex-none place-items-center rounded-xl text-xl",
                    TONES[i % TONES.length],
                  )}
                >
                  {ICONS[habit.icon] ?? "✅"}
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`habit-${habit.id}`} className="block text-[15px] font-bold">
                    {habit.title}
                  </label>
                  <small className="text-xs text-ink-soft">
                    {habit.currentStreak} day streak
                  </small>
                </div>
                <span className="relative grid size-11 flex-none place-items-center">
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
                    animate={isDone ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={cn(
                      "grid size-[30px] place-items-center rounded-full border-2 border-ink transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lav-ink",
                      isDone && "bg-ink",
                    )}
                  >
                    {isDone && <AnimatedCheck className="size-4 text-lime" />}
                  </motion.span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
