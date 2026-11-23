# M1: Progress engine + Gamification backend (B2)

**Owner:** Mayur · **Branch:** `feat/progress-gamification`
**Do this first.** Khushi's habits task (B3) uses the helpers you build here, so open this PR as soon as it passes.

## Goal
1. One shared, database-backed "progress engine" that every feature (training, habits, boss) uses to give XP, level up, progress daily quests and award badges. Then nobody writes this logic twice.
2. A real `GamificationRepository` (profile, badges, quests) that replaces the mock.

## Read first
- `PROJECT_OVERVIEW.md` section 5.4 (Gamification) and 9 (database), `BUILD_PLAN.md` "Rules", `AGENTS.md`
- `src/data/repositories.ts` (`GamificationRepository`)
- `src/lib/types.ts` (`UserProfile`, `UserStats`, `Badge`, `Quest`, `QuestType`)
- `src/lib/gamification.ts` (`levelForXp`, `progressToNextLevel`, `STREAK_MILESTONES`) and `src/lib/time.ts` (`APP_TIMEZONE` = Asia/Kolkata, `todayISO()`)
- `src/data/mock/state.ts` (`grantXp`, `awardBadges`, `bumpQuests`, the 3 default quests) and `src/data/mock/others.ts` (mock gamification repo): copy their **behaviour**, not their in-memory storage
- `prisma/schema.prisma` (`User`, `XpEvent`, `Badge`, `UserBadge`, `DailyQuest`, `Attempt`, `HabitLog`, `RoleplaySession`) and `prisma/seed.ts` (the 8 badges and their `ruleType` / `ruleValue`), `src/server/db.ts`

## Build
1. `src/server/progress/` (`import "server-only"` in every non-test file). Every function takes a Prisma **transaction client** `tx` (type `Prisma.TransactionClient`) so the caller can do all its writes in one transaction:
   - `quests.ts`: `QUEST_DEFS` (type → label, target, xpReward), same three as the mock: scenario "Finish 1 scenario" 1 / 30 XP, habit "Check in 3 habits" 3 / 20 XP, stars "Score 2 stars or more" 1 / 25 XP.
     `ensureTodayQuests(tx, userId)`: creates today's three `DailyQuest` rows (date = today in Asia/Kolkata) if they don't exist yet; returns them as `Quest[]`.
   - `award.ts`:
     - `awardXp(tx, userId, { source, amount, refId? })` → `{ xp, level, leveledUp?: { newLevel } }`: creates an `XpEvent`, increments `User.xp`, sets `User.level = levelForXp(xp)`. `amount <= 0` does nothing.
     - `progressQuests(tx, userId, type, by = 1)` → `Quest[]` completed by this call: ensures today's quests, advances the open quest of that type (capped at target), and when one completes gives its xpReward via `awardXp` with source QUEST.
     - `checkBadges(tx, userId)` → `Badge[]` newly earned: evaluates every badge rule against the user's real counts (`scenarios_completed` = finished attempts, `perfect_scores` = 3-star attempts, `streak_days` = `User.bestStreak`, `category_stars` = stars in one category, `boss_wins` = won roleplay sessions; `team_assignments` may return not-earned for now, add a TODO). Inserts `UserBadge` rows (skip already earned).
     - `touchStreak(tx, userId)`: updates the user's overall `currentStreak` / `bestStreak` / `lastActiveDate` for "active today" (Asia/Kolkata days; same day = no change, yesterday = +1, older = reset to 1).
   - `stats.ts`: `getUserStats(db, userId)` → `UserStats` (and add `bossWins: number` to `UserStats` in `src/lib/types.ts`, plus `bossWins` in the mock so it still type-checks).
   - Pure logic (quest progress, badge rule check, streak update, Asia/Kolkata day math) goes in pure functions with tests: `src/server/progress/*.test.ts`.
2. `src/server/gamification/repository.ts`: `export const realGamificationRepo: GamificationRepository`:
   - `getProfile(userId)`: user summary, role, email, team, xp/level/progress, streaks, `stats` from `getUserStats`, earned badges.
   - `listBadges(userId)`: all 8 badges, `earnedAt` set or null.
   - `listQuests(userId)`: today's quests (calls `ensureTodayQuests`).
   Match the mock's output shape exactly (the UI already uses it).
3. Boss hookup: in `src/server/boss/repo.ts` replace only the direct `db.xpEvent.create` / XP update in `finishSession` with `awardXp` + `checkBadges` + `touchStreak` inside one transaction, and return the new badges in `newBadges`. Change nothing else there.
4. Wire it in `src/data/index.ts`: `gamificationRepo = source === "real" ? realGamificationRepo : mockGamificationRepo` (only that line + import).
5. `src/server/progress/README.md`: short explanation of XP, levels, quests, badges and streaks, with the exact function signatures (Khushi's habits code calls them; this also goes in the report).

## Allowed to touch
`src/server/progress/**`, `src/server/gamification/**`, `UserStats` in `src/lib/types.ts` + the matching mock field, the XP part of `finishSession` in `src/server/boss/repo.ts`, the gamification line + import in `src/data/index.ts`. Nothing else.

## Never
`git commit/push/reset/checkout` (the person running you does that), print or edit `.env`, change `prisma/schema.prisma`, touch `src/server/habits/**`, `src/server/leaderboard/**` (Khushi's) or any UI under `src/app/`, `src/features/`, `src/components/`.

## Done when
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- With `DATA_SOURCE=real`, `pnpm dev`, log in as `aarohi@shiftly.demo` / `demo1234`: Profile shows real XP, badges and stats from the database; Home/Profile quests appear for today.
- Report: files changed, the function signatures in `src/server/progress/`, test results.
