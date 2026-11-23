/**
 * TEMPORARY plain detail view of one detected habit. A later UI pass redesigns this screen.
 * Data shape: HabitDetail (docs/contract-auto-habits.md).
 */
import Link from "next/link";
import type { HabitDetail } from "@/lib/types";

export interface HabitDetailScreenProps {
  habit: HabitDetail;
}

export function HabitDetailScreen({ habit }: HabitDetailScreenProps) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6">
      <Link href="/habits">Back to habits</Link>
      <h1>{habit.title}</h1>
      <p>{habit.description}</p>
      <p>
        {habit.stage}, {habit.status}. Streak {habit.currentStreak} (best {habit.bestStreak}). Consistency{" "}
        {Math.round(habit.consistency * 100)}%.
      </p>
      {habit.statusNote && <p>{habit.statusNote}</p>}
      {habit.nextStage && (
        <p>
          Next stage {habit.nextStage.stage}: {Math.round(habit.nextStage.progress * 100)}%. {habit.nextStage.hint}
        </p>
      )}
      <h2>Recent</h2>
      <ul>
        {habit.recent.map((o) => (
          <li key={o.at}>
            {o.at.slice(0, 10)}: {o.label}
          </li>
        ))}
      </ul>
    </main>
  );
}
