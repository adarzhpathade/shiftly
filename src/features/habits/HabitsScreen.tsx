/**
 * TEMPORARY plain list of the detected habits. A later UI pass redesigns this screen.
 * Data shape: HabitsOverview (docs/contract-auto-habits.md).
 */
import Link from "next/link";
import type { HabitsOverview } from "@/lib/types";

export interface HabitsScreenProps {
  overview: HabitsOverview;
}

export function HabitsScreen({ overview }: HabitsScreenProps) {
  const { habits, nextHabit, insights, coachNote, firstHabits, fadingCount } = overview;
  const insightTexts = [
    insights.bestTimeOfDay?.text,
    insights.mostSkippedWeekday?.text,
    insights.skillLink?.text,
    insights.streakAtRisk?.text,
  ].filter((t): t is string => Boolean(t));

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6">
      <h1>Habits</h1>

      <section aria-label="Weekly coach note">
        <h2>Coach note ({coachNote.isoWeek})</h2>
        <ul>
          {coachNote.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Your habits">
        <h2>Your habits</h2>
        {habits.length === 0 && firstHabits ? (
          <p>
            First habits forming: {Math.round(firstHabits.progress * 100)}% ({firstHabits.occurrences} of{" "}
            {firstHabits.needed}). {firstHabits.hint}
          </p>
        ) : (
          <ul>
            {habits.map((h) => (
              <li key={h.key}>
                <Link href={`/habits/${encodeURIComponent(h.key)}`}>{h.title}</Link> ({h.stage}, {h.status},{" "}
                {h.currentStreak} day streak, consistency {Math.round(h.consistency * 100)}%)
              </li>
            ))}
          </ul>
        )}
        {fadingCount > 0 && <p>{fadingCount} faded habit(s) hidden.</p>}
      </section>

      {nextHabit && (
        <section aria-label="Next habit to form">
          <h2>Next habit</h2>
          <p>
            {nextHabit.title}: {nextHabit.occurrences} of {nextHabit.needed} so far. {nextHabit.reason}
          </p>
        </section>
      )}

      {insightTexts.length > 0 && (
        <section aria-label="Insights">
          <h2>Insights</h2>
          <ul>
            {insightTexts.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
