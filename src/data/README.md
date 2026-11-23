# data

The data contract between screens and backends.

- `repositories.ts`: repository **interfaces** (pure TS). Home, Training, Boss, Habit (auto-detected), Activity, PasswordReset, Gamification, Leaderboard.
- `mock/`: in-memory implementations with ~300-500 ms fake delay (`MOCK_DELAY_SCALE=0` disables it, used by tests). State is mutable per server process, so check-ins, answers and boss turns change what you see next. `resetMockState()` restores the seed.
- `index.ts`: exports the active implementations (`homeRepo`, `trainingRepo`, `bossRepo`, `habitRepo`, `activityRepo`, `passwordResetRepo`, `gamificationRepo`, `leaderboardRepo`). It imports `server-only`, so it can only be used in route files and server actions.

## How a screen gets data

Screens in `src/features/` never import `@/data`. A route file in `src/app/` does:

```tsx
// src/app/(app)/page.tsx (server component)
import { homeRepo } from "@/data";
import { HomeScreen } from "@/features/home/HomeScreen";

export default async function Page() {
  const home = await homeRepo.getHome(userId); // userId from the session
  return <HomeScreen data={home} myRank={null} />;
}
```

## How actions work

Mutations are server actions defined next to the route (`"use server"`), which call a repository and return the result. They are passed to the screen as callbacks (`onAnswer`, ...). The screen shows loading and the returned result (and `Celebration`s built from `leveledUp`, `newBadges`, `milestone`, `stageUps`).

```ts
"use server";
export async function startAttemptAction(scenarioId: string) {
  return trainingRepo.startAttempt(await currentUserId(), scenarioId);
}
```

Guided scenario flow: `getGuidedScenario` -> `startAttempt` -> `answerStep` (repeat until `nextStepId` is null) -> `finishAttempt`.
Boss flow: `startSession` -> `sendMessage` (async iterable of `token` events, then one `turn` event; stream it from a route handler or server action) -> `finishSession`. In the mock, send `/fail` to simulate the AI being down (error event with `fallback: true`).

## How a backend task implements a repository

1. Implement the interface from `repositories.ts` in `src/server/<domain>/` (for example `HabitRepository` in `src/server/habits/`). Do not change the interface or `@/lib/types`; ask the lead if the contract must change.
2. Reuse the pure rules in `@/lib/gamification` (levels, stars, XP, streaks) so mock and real behave the same.
3. In `src/data/index.ts`, import the real implementation and pick it when `DATA_SOURCE === "real"` (per repository, one feature at a time). Until every repository has a real version, the others stay on the mock.
4. Run with `DATA_SOURCE=real`. Run the mock tests as a reference for expected behaviour (`src/data/mock/mock.test.ts`).

Note: mock placeholder scenarios (every level except Handling Complaints 1 and 3) reuse the two seeded scenarios' content.

## Contract rules worth knowing

- Quests grant their XP automatically when completed. Results (`ScenarioResult`, `BossResult`) list them in `questsCompleted`; `xpEarned` excludes that bonus (total gain = `xpEarned` + sum of quest `xpReward`).
- Habits are detected automatically from logged activity (no create/edit/check-in). See `docs/contract-auto-habits.md` for the model, rules, activity events and the password-reset contract.
- Boss: `startSession` returns `{ ok: false, reason: 'daily-limit', resetsAt }` after `BOSS_DAILY_LIMIT` starts a day. Replies over `MAX_REPLY_CHARS` give an error event with `fallback: false`. A `fallback: true` error sets the status to `'fallback'` and `BossSession.fallbackScenarioId` points to the guided version.
