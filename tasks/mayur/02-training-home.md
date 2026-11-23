# M2: Training backend (B1) + Home

**Owner:** Mayur · **Branch:** `feat/training-api` · **Start after M1 is merged** (`git checkout main && git pull` first).

## Goal
Save training for real: attempts, answers, stars, XP and level unlocks. Then make Home read real data.

## Read first
- `PROJECT_OVERVIEW.md` sections 5.1–5.2 (Training) and 9, `BUILD_PLAN.md` "Rules", `AGENTS.md`
- `src/data/repositories.ts` (`TrainingRepository`, `HomeRepository`, the flow comment above `TrainingRepository`)
- `src/lib/types.ts` (`Category`, `LevelNode`, `GuidedScenario`, `AttemptStart`, `AnswerResult`, `ScenarioResult`, `HomeData`, `TodaysChallenge`, `ContinueTraining`)
- `src/lib/gamification.ts` (`starsForScore`, `guidedXp`, `replayXp`)
- `src/data/mock/training.ts` and the home part of `src/data/mock/others.ts`: copy their **behaviour** (unlock rules, best-score XP rule, Today's Challenge pick), not their storage
- `src/server/progress/README.md` (your M1 helpers: use them, don't rewrite them)
- `prisma/schema.prisma` (`Category`, `Scenario`, `ScenarioStep`, `Choice`, `Attempt`, `AttemptAnswer`), `prisma/seed.ts`, `prisma/seed/scenarios/index.ts` (`seedScenarios`)

## Build
1. **Seed:** call `seedScenarios(prisma)` from `prisma/seed/scenarios/index.ts` inside `prisma/seed.ts` (after categories). The seed must stay re-runnable (upserts). Run `pnpm db:seed` against the dev database and check the 16 scenarios exist.
2. **One small migration (allowed only here):** add `finishedAt DateTime?` to `Attempt` so an unfinished attempt can be told apart (`pnpm db:migrate --name attempt-finished-at`). Nothing else in the schema.
3. `src/server/training/repository.ts`: `export const realTrainingRepo: TrainingRepository` (`import "server-only"`):
   - `listCategories(userId)`: categories with the user's progress (levels done, stars) like the mock.
   - `getLevelPath(userId, categoryKey)`: levels in order with best stars and locked/unlocked/boss state, using the mock's unlock rule (level N+1 opens when level N has ≥1 star; boss after the guided levels).
   - `getGuidedScenario(id)`: steps and choices **without** ratings/feedback (nothing that leaks the answer).
   - `startAttempt`: creates an `Attempt` (score 0, `finishedAt` null), returns `{ attemptId, firstStepId }`.
   - `answerStep`: only on the user's own unfinished attempt; rejects a step answered twice; saves an `AttemptAnswer`; returns rating, feedback and `nextStepId` (branching from the choice).
   - `finishAttempt`: computes score/max, `starsForScore`, XP with the **best-score rule** (`replayXp` vs. the previous best stars, so replays only pay the improvement), sets `finishedAt`. In **one transaction**: `awardXp` (SCENARIO), `progressQuests` ("scenario", and "stars" when stars ≥ 2), `checkBadges`, `touchStreak`. Returns `ScenarioResult` with `bestStars`, `leveledUp`, `newBadges`, `questsCompleted`, `nextScenarioId`, `perStep`.
   - Pure parts (scoring, unlock rule, next scenario pick) in `src/server/training/scoring.ts` with tests `scoring.test.ts`.
4. `src/server/home/repository.ts`: `export const realHomeRepo: HomeRepository` building `HomeData` from the real repos (training categories, `habitRepo.listToday` from `@/data`, quests, Today's Challenge = same rule as the mock).
5. Wire `trainingRepo` and `homeRepo` in `src/data/index.ts` (`source === "real" ? real… : mock…`, only those lines + imports). Remove the old "no real repositories exist yet" warning once all repos are wired (if Khushi's are merged by then; otherwise leave it).
6. `src/server/training/README.md`: how scoring, stars, the best-score XP rule and unlocks work.

## Allowed to touch
`src/server/training/repository.ts`, `scoring*.ts`, `README.md` (leave the existing `actions.ts`, `types.ts`, `actions.test.ts` unless a type import is needed), `src/server/home/repository.ts`, `prisma/seed.ts` (the scenario call only), the `finishedAt` migration, the training + home lines in `src/data/index.ts`.

## Never
`git commit/push/reset/checkout`, print or edit `.env`, other schema changes, touch Khushi's folders (`src/server/habits/**`, `src/server/leaderboard/**`) or any UI.

## Done when
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- With `DATA_SOURCE=real`: play level 1 of a category, finish it, restart `pnpm dev`: the stars and XP are still there, level 2 is unlocked. Replaying level 1 with the same stars gives 0 XP. After levels 1–4 the boss unlocks.
- Report: files changed, the scoring/XP rules, test results.
