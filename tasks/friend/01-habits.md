# B3: Habits backend

**Owner:** Friend · **Branch:** `feat/habits-api`

## Goal
Replace the mock habit data with a real implementation backed by the Postgres database, so habits, check-ins and streaks are saved.

## Read first
- `PROJECT_OVERVIEW.md` sections 5.3 (Habit Mode) and 9 (database)
- `BUILD_PLAN.md` section "Rules"
- `AGENTS.md`
- `src/data/repositories.ts` (the `HabitRepository` interface: the contract you implement)
- `src/lib/types.ts` (`Habit`, `HabitInput`, `HabitTemplate`, `HabitDetail`, `CheckInResult`, `Quest`)
- `src/lib/gamification.ts` (`streakAfterCheckIn` with the `daysOfWeek` schedule, `streakMilestone`, `isoWeekday`, date helpers) and `src/lib/time.ts` (`APP_TIMEZONE` = Asia/Kolkata, `todayISO()`)
- `src/data/mock/habits.ts` (the mock version: copy its behaviour, not its in-memory storage)
- `prisma/schema.prisma` (`Habit`, `HabitLog`, `HabitTemplate`, `User`, `XpEvent`, `DailyQuest`, `Badge`, `UserBadge`) and `src/server/db.ts` (the Prisma client)

## Build
1. `src/server/habits/repository.ts`: `export const realHabitRepo: HabitRepository` implementing every method with Prisma (`import "server-only"`; use `db` from `src/server/db.ts`):
   - `listToday(userId)`: all active habits of the user with `scheduledToday` (from frequency + `daysOfWeek`), `doneToday` (a `HabitLog` exists for today in Asia/Kolkata), `currentStreak`, `bestStreak`.
   - `listTemplates()`: from `HabitTemplate`.
   - `create`, `update`, `remove`: only on the user's own habits (any other habit id → throw a "not found" error). `remove` deletes the habit and its logs.
   - `checkIn(userId, habitId, note?)`: if already checked in today, return the current state without double-counting. Otherwise create a `HabitLog`, compute the new streak with `streakAfterCheckIn` (pass the habit's `daysOfWeek`), award **10 XP** (an `XpEvent` with source HABIT and `User.xp` incremented; update `User.level` with `levelForXp`), update the user's overall `currentStreak` / `bestStreak` / `lastActiveDate`, award the `streak-7` / `streak-30` badges when a milestone is reached (`UserBadge`, skip if already earned), and progress today's habit quest if one exists (`DailyQuest`; completed quests grant their XP; return them in `questsCompleted`). Do all writes in **one transaction**.
   - `getDetail(userId, habitId)`: the habit, a heatmap of the last 12 weeks (`{date, done}` per day), completion rate over scheduled days, and recent notes.
   - Streaks for a habit are computed from its `HabitLog` dates (store nothing extra), counting only scheduled days.
2. `src/server/habits/streaks.ts`: pure helper(s) that compute current and best streak from a list of log dates + schedule, with tests in `src/server/habits/streaks.test.ts` (daily habit, weekday-only habit skipping weekends, gap resets, same-day double check-in, empty history).
3. Wire it in `src/data/index.ts`: `export const habitRepo: HabitRepository = source === "real" ? realHabitRepo : mockHabitRepo;` (change only that line plus the import; leave the other repositories alone).
4. `src/server/habits/README.md`: how check-in, streak and XP work (short; this goes in the report).

## Allowed to touch
`src/server/habits/**`, the habit line + import in `src/data/index.ts`. Nothing else.

## Never
`git commit/push/reset/checkout` (the person running you does that), print or edit `.env`, change the database schema, touch other folders.

## Done when
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- With `DATA_SOURCE=real` in `.env`, `pnpm dev`, log in as an employee from `prisma/README.md`: creating a habit and checking it in saves it (it is still there after a restart), checking in twice on the same day does not add XP twice.
- Report: files changed, how the streak is calculated, test results.
