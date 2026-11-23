# B4: Leaderboard backend

**Owner:** Khushi · **Branch:** `feat/leaderboard-api` · Independent: start any time.

## Goal
Replace the mock leaderboard with real rankings computed from the XP history in the database.

## Read first
- `PROJECT_OVERVIEW.md` section 5.4 (Gamification) and the leaderboard decision in section 14 (company-only, Team and Company views, weekly reset + all time)
- `BUILD_PLAN.md` section "Rules"
- `AGENTS.md`
- `src/data/repositories.ts` (`LeaderboardRepository`)
- `src/lib/types.ts` (`LeaderboardScope`, `LeaderboardPeriod`, `LeaderboardEntry`, `Leaderboard`, `UserSummary`)
- `src/lib/time.ts` (`APP_TIMEZONE` = Asia/Kolkata)
- `src/data/mock/others.ts` (the mock leaderboard: match its output shape)
- `prisma/schema.prisma` (`User`, `Team`, `XpEvent`) and `src/server/db.ts`

## Build
1. `src/server/leaderboard/repository.ts`: `export const realLeaderboardRepo: LeaderboardRepository` (`import "server-only"`):
   - `get(userId, scope, period)`:
     - **scope** `team`: only users in the viewer's team; `company`: all users with role EMPLOYEE (managers and admins are not ranked).
     - **period** `week`: sum of `XpEvent.amount` since **Monday 00:00 Asia/Kolkata** of the current week; `all`: the user's total `User.xp`.
     - Sorted by XP descending; ties broken by name; ranks 1, 2, 3, … (equal XP shares the same rank).
     - `rankChange`: rank now minus rank as of the end of yesterday (same scope and period), positive = moved up. 0 for new users.
     - `entries`: the top 50; `me`: the viewer's own entry even if not in the top 50 (null for managers/admins in company scope).
   - Use SQL aggregation (Prisma `groupBy` or `$queryRaw` with parameters), not loading every event into memory. Mind the `XpEvent(userId, createdAt)` index.
2. `src/server/leaderboard/ranking.ts`: pure helpers (start of week in Asia/Kolkata, ranking with ties, rank change) with tests in `src/server/leaderboard/ranking.test.ts` (ties, week boundary on Monday morning IST, empty team, viewer outside the top 50).
3. Wire it in `src/data/index.ts`: `export const leaderboardRepo: LeaderboardRepository = source === "real" ? realLeaderboardRepo : mockLeaderboardRepo;` (only that line plus the import).
4. `src/server/leaderboard/README.md`: how ranking, weekly reset and rank change work (short; goes in the report).

## Allowed to touch
`src/server/leaderboard/**`, the leaderboard line + import in `src/data/index.ts`. Nothing else.

## Never
`git commit/push/reset/checkout`, print or edit `.env`, change the database schema, touch other folders.

## Done when
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- With `DATA_SOURCE=real`, the seeded demo data gives a sensible weekly and all-time ranking for an employee login (check via a temporary script or the leaderboard page once it exists).
- Report: files changed, the ranking rules, test results.
