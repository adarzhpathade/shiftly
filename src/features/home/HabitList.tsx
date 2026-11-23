/**
 * TEMPORARY plain list of the detected habits on Home. A later UI pass redesigns it.
 * Data shape: HomeHabits (docs/contract-auto-habits.md).
 */
import Link from "next/link";
import type { HomeHabits } from "@/lib/types";

export interface HabitListProps {
  habits: HomeHabits;
}

export function HabitList({ habits }: HabitListProps) {
  const forming =
    habits.firstHabitsProgress === null ? "" : ` (first habits forming: ${Math.round(habits.firstHabitsProgress * 100)}%)`;
  return (
    <section aria-label="Your habits">
      <h2>Your habits</h2>
      {habits.items.length === 0 ? (
        <p>
          No habits yet{forming}. <Link href="/habits">View habits</Link>
        </p>
      ) : (
        <ul>
          {habits.items.map((h) => (
            <li key={h.key}>
              <Link href={`/habits/${encodeURIComponent(h.key)}`}>{h.title}</Link> ({h.stage}, {h.status},{" "}
              {h.currentStreak} day streak)
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
