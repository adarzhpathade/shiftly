# Leaderboard Backend

The Shiftly leaderboard provides real-time ranking computed from XP activity in the database.

## Architecture

The leaderboard module consists of two main components:
1. `src/server/leaderboard/ranking.ts`: Pure, deterministic ranking calculation and timezone helpers.
2. `src/server/leaderboard/repository.ts`: Database query implementation (`realLeaderboardRepo`) satisfying `LeaderboardRepository`.

---

## Ranking Rules

### 1. Sorting and Ties
- **Primary sort**: Total period XP descending (`b.xp - a.xp`).
- **Tie-breaker**: Alphabetical by user name (`a.name.localeCompare(b.name)`), then by user ID for stability.
- **Ranks**: Standard competition ranking (1, 1, 3, …). Users with identical XP share the same rank. The subsequent rank accounts for the number of tied individuals ahead.

### 2. Timezone & Weekly Reset on Monday IST
- Shiftly's canonical timezone is **Asia/Kolkata** (UTC+5:30 with no DST).
- The weekly leaderboard period starts on **Monday 00:00:00.000 Asia/Kolkata** (`startOfWeekIST`).
- All XP earned via `XpEvent` entries with `createdAt >= startOfWeekIST` are aggregated into the weekly total.
- At Sunday 23:59:59 IST, events belong to the closing week. At the stroke of Monday 00:00:00 IST, the week resets and only newly earned XP in the new week is counted.

### 3. Rank Change
- `rankChange` is defined as:
  $$\text{rankChange} = \text{yesterdayRank} - \text{currentRank}$$
  - A positive value means the user moved **up** (e.g. from rank 5 yesterday to rank 2 today = $+3$).
  - A negative value means the user moved **down** (e.g. from rank 2 yesterday to rank 5 today = $-3$).
  - `0` means the rank is unchanged.
- **New users**: Users created today (`createdAt >= startOfTodayIST`) receive `rankChange: 0` and `isNew: true`.
- **Monday weekly reset**: On Monday morning IST, the week has just begun and there is no yesterday rank in the current week. Weekly rank change is therefore `0`.
- **All-time rank change**: Compares the user's current total XP against their XP as of the end of yesterday (`currentXp - todayEvents`).

---

## Scopes and Periods

- **Scopes**:
  - `team`: Restricted to members of the viewer's team (`where: { teamId: viewer.teamId }`).
  - `company`: Restricted to all employees (`where: { role: Role.EMPLOYEE }`). Managers and administrators are excluded from company rankings.
- **Periods**:
  - `week`: Sum of `XpEvent.amount` since Monday 00:00 IST.
  - `all`: User's total all-time `User.xp`.

- **Top 50 & Viewer Entry**:
  - `entries`: Capped at the top 50 ranked entries.
  - `me`: The viewer's own rank entry, calculated over the full pool and preserved even when the viewer is ranked beyond 50. For unranked roles in company scope (e.g., manager or admin), `me` is `null`.
