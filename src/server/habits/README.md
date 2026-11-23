> **LEGACY (2026-11-23):** this manual-habit backend is being replaced by automatic habit detection. It is no longer wired into `src/data/index.ts`. See `docs/contract-auto-habits.md`.

# Habits Backend

The Shiftly habits backend manages habit creation, editing, scheduling, daily check-ins, and streak calculation backed by PostgreSQL via Prisma.

## Architecture

The module consists of two main components in `src/server/habits/`:
1. `streaks.ts`: Pure algorithmic helper (`computeHabitStreaks`) that evaluates log dates against habit schedules to calculate `currentStreak` and `bestStreak`.
2. `repository.ts`: Database-backed implementation (`realHabitRepo`) satisfying the `HabitRepository` contract.

---

## Streak Calculation

Habit streaks are calculated purely from `HabitLog` dates without requiring dedicated counter columns:
1. **Deduplication & Sorting**: Log timestamps are converted to `YYYY-MM-DD` strings in the application timezone (`Asia/Kolkata`), deduplicated, and sorted in ascending order.
2. **Scheduled Day Filtering**: For scheduled habits (e.g. weekday-only habits with `daysOfWeek = [1, 2, 3, 4, 5]`), non-scheduled days (weekends) do not break the streak.
3. **Streak Continuity**:
   - Consecutive scheduled days increment the streak.
   - If a scheduled day was skipped between check-ins, the streak resets to 1.
   - The current streak remains alive as of `today` if no scheduled days were missed since the last check-in. If a scheduled day was missed prior to today, `currentStreak` resets to 0.
4. **Historical Best**: Tracks the maximum continuous streak achieved across the user's entire history (`bestStreak`).

---

## Check-Ins & Gamification

When an employee checks in on a habit (`checkIn(userId, habitId, note?)`):
1. **Idempotency**: If the habit was already checked in today in `Asia/Kolkata`, the repository returns the current state with `xpEarned: 0` and empty new badges/quests, preventing double rewards.
2. **Atomic Transaction**: If checking in for the first time today, all state updates execute within a single `db.$transaction`:
   - Creates a `HabitLog` record with the date and optional reflection note.
   - Recomputes the habit's current streak and best streak.
   - Calls `awardXp(tx, userId, { source: "HABIT", amount: 10, refId: habitId })` to grant 10 XP and evaluate level-ups.
   - Calls `touchStreak(tx, userId)` to update the user's overall daily activity streak.
   - Calls `progressQuests(tx, userId, "habit", 1)` to increment the "Check in 3 habits" daily quest.
   - Calls `checkBadges(tx, userId)` to evaluate badge unlocks (including `streak-7` and `streak-30`).
   - Checks milestone celebration thresholds (`streakMilestone`: 7, 30, 100).
