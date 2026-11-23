# B8: Habit Analyzer backend (auto-detected habits)

**Owner:** Khushi · **Branch:** `feat/habit-analyzer`

## Goal
Habits are now fully automatic. Users never add, pick or check in habits. The app logs what they do (activity events) and **you detect habits from repeating behaviour**. Replace the mock habit data with a real analyzer that computes everything the Habits page shows from the `ActivityEvent` table.

## Read first
- `AGENTS.md`, `BUILD_PLAN.md` section "Rules"
- `docs/contract-auto-habits.md`: **the rules you implement** (detection threshold, stages, slipping/fading, insights, next habit to form). Follow it exactly; if something there is unclear or impossible, stop and report it.
- `src/data/repositories.ts`: the `HabitRepository` interface (the contract you implement; the coach-note method is NOT yours, see below)
- `src/lib/types.ts`: the detected-habit types (`DetectedHabit`, `HabitStage`, `HabitStatus`, `HabitInsights`, `NextHabitSuggestion`, `HabitsOverview`, `HabitDetail`, activity event types)
- `src/data/mock/habits.ts`: the mock version (match its output shape exactly; the UI is built against it)
- `src/lib/gamification.ts` and `src/lib/time.ts` (`APP_TIMEZONE` = Asia/Kolkata, `todayISO()`, date helpers)
- `src/server/progress/README.md` (`awardXp`; use it for stage-up XP, never write XP logic yourself)
- `prisma/schema.prisma` (`ActivityEvent`, `HabitStageAward`, `Attempt`, `Category`) and `src/server/db.ts`

## Build
1. `src/server/habits/analyzer.ts`: **pure functions only** (no database), given a list of activity events + "now":
   - group events into behaviours (for example "trains in the evening", "plays category X", "clocks in in the morning");
   - detect habits (threshold from the contract doc), usual days of week, usual time window;
   - stage (forming / building / solid), status (on_track / slipping / fading), current/best streak counted on usual days only, consistency 0–1, 12-week heatmap;
   - insights: best time of day, most-skipped weekday, habit-to-skill link (compare scenario stars on habit days vs other days), streak-at-risk nudge text; each is `null` when there is too little data;
   - next habit to form from the weakest category (lowest average stars, or not played), with progress toward forming;
   - first-habits-forming progress for new users.
   All days and times in **Asia/Kolkata**.
2. `src/server/habits/analyzer.test.ts`: tests for every rule:
   - empty history (new user);
   - exactly at / below the detection threshold;
   - each stage boundary;
   - slipping after a missed usual day;
   - slipping after today's time window;
   - fading after 14 days;
   - weekday-only behaviour not broken by weekends;
   - IST midnight boundary;
   - insight is null with thin data;
   - weakest-category suggestion.
3. `src/server/habits/repository.ts`: **replace** the old manual-habit code with `export const realHabitRepo: HabitRepository` (`import "server-only"`):
   - `getOverview(userId)` and `getDetail(userId, habitKey)`: load the user's `ActivityEvent` rows for the last 12 weeks (one query, uses the `userId + createdAt` index) plus whatever the skill link needs, then call the analyzer.
   - When a habit reaches a **new stage** for the first time, award the stage-up bonus once: in one transaction, insert `HabitStageAward` (unique, so it is paid once) + `awardXp`, and return `stageUp` as the contract says.
   - An unknown user id is an error. **Never fall back to another user.**
   - `getCoachNote` is built by another worker (`src/server/coach/`). If the interface puts it on `HabitRepository`, delegate to `@/server/coach` if it exists, otherwise return the contract's plain fallback text, and leave a TODO.
4. Delete the old manual-habit files in `src/server/habits/` (`streaks.ts`, old tests) that nothing uses anymore. Run `pnpm typecheck` to confirm.
5. Wire `habitRepo` in `src/data/index.ts`: `source === "real" ? realHabitRepo : mockHabitRepo` (only that line + import).
6. `src/server/habits/README.md`: rewrite: how detection, stages, slipping and insights work (short; this goes in the report and viva).

## Allowed to touch
`src/server/habits/**`, the habit line + import in `src/data/index.ts`. Nothing else.

## Never
- `git commit/push/reset/checkout` (the person running you does that).
- Print or edit `.env`.
- Change `prisma/schema.prisma`.
- Touch `src/server/activity`, `src/server/password-reset`, `src/server/coach` (other workers) or any UI.

## Done when
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- With `DATA_SOURCE=real`: a script or test that inserts sample activity for a temporary user shows detected habits, stages and insights. Delete the temporary user afterwards.
- Report: files changed, the detection rules as implemented, test results.
