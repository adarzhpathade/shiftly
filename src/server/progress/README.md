# Shiftly Progress & Gamification Backend

Shared database-backed progress engine that powers XP awards, level progression, daily quests, badge awards, and streak tracking across the entire application (training, habits, boss challenges, etc.).

All mutating operations accept a Prisma transaction client (`tx: Prisma.TransactionClient`), enabling features to perform atomic multi-table updates within a single database transaction.

---

## Architecture & Mechanics

### 1. XP & Levels
- **XP Progression Curve**: Quadratic formula defined in `src/lib/gamification.ts`:
  $$\text{Total XP for Level } L = \frac{250 \cdot (L - 1) \cdot L}{2}$$
  - Level 1: 0 XP
  - Level 2: 250 XP
  - Level 3: 750 XP
  - Level 4: 1500 XP
  - Level 5: 2500 XP
- **Awarding XP**: `awardXp` logs an `XpEvent`, increments `User.xp`, updates `User.level` via `levelForXp(newXp)`, and detects if `newLevel > beforeLevel`. If `amount <= 0`, it performs no database writes and returns current values.

### 2. Daily Quests
- **Timezone**: All dates operate in `Asia/Kolkata` (`APP_TIMEZONE`).
- **Standard Quests**: 3 daily quests initialized for each active day via `ensureTodayQuests`:
  1. `scenario`: "Finish 1 scenario" (target: 1, reward: 30 XP)
  2. `habit`: "Check in 3 habits" (target: 3, reward: 20 XP)
  3. `stars`: "Score 2 stars or more" (target: 1, reward: 25 XP)
- **Progress & Completion**: `progressQuests(tx, userId, type, by)` increments progress (capped at target). Upon reaching the target, it automatically awards the quest's XP reward using `awardXp` with source `QUEST`.

### 3. Badges
Evaluates 8 badge rules defined in the database (`Badge` model) against the user's real database records, automatically skipping badges already present in `UserBadge`:
1. `first-steps`: `scenarios_completed >= 1` (finished attempts)
2. `query-master`: `scenarios_completed >= 10` (finished attempts)
3. `perfect-score`: `perfect_scores >= 1` (3-star attempts)
4. `streak-7`: `streak_days >= 7` (`User.bestStreak`)
5. `streak-30`: `streak_days >= 30` (`User.bestStreak`)
6. `complaint-crusher`: `category_stars >= 12` (stars in a category)
7. `boss-slayer`: `boss_wins >= 1` (won `RoleplaySession`s)
8. `team-player`: `team_assignments >= 5` (stubbed for assignments feature)

### 4. Streaks
Calculates overall daily activity streaks based on calendar days in `Asia/Kolkata`:
- **Same day**: No change (`status: 'same-day'`).
- **Consecutive day (yesterday)**: Increments streak by 1 (`status: 'continued'`).
- **Gap of 2+ days**: Resets current streak to 1 (`status: 'reset'`).
- **First activity**: Initializes current streak to 1 (`status: 'first'`).
- Updates `User.bestStreak = max(bestStreak, currentStreak)` and sets `lastActiveDate = new Date()`.

---

## Function Signatures

### Quests (`src/server/progress/quests.ts`)

```typescript
export interface QuestDef {
  readonly type: QuestType;
  readonly label: string;
  readonly target: number;
  readonly xpReward: number;
}

export const QUEST_DEFS: readonly QuestDef[];

export function ensureTodayQuests(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<Quest[]>;
```

### Awards & Gamification (`src/server/progress/award.ts`)

```typescript
export interface AwardXpInput {
  readonly source: XpSource | keyof typeof XpSource;
  readonly amount: number;
  readonly refId?: string | null;
}

export interface AwardXpResult {
  readonly xp: number;
  readonly level: number;
  readonly leveledUp?: { readonly newLevel: number };
}

export interface StreakResult {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly status: StreakStatus;
}

export function awardXp(
  tx: Prisma.TransactionClient,
  userId: string,
  input: AwardXpInput,
): Promise<AwardXpResult>;

export function progressQuests(
  tx: Prisma.TransactionClient,
  userId: string,
  type: QuestType,
  by?: number,
): Promise<Quest[]>;

export function checkBadges(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<Badge[]>;

export function touchStreak(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<StreakResult>;
```

### User Statistics (`src/server/progress/stats.ts`)

```typescript
export function getUserStats(
  db: PrismaClient | Prisma.TransactionClient,
  userId: string,
): Promise<UserStats>;
```

---

## Usage Example

```typescript
import { db } from "@/server/db";
import { awardXp, checkBadges, progressQuests, touchStreak } from "@/server/progress";
import { XpSource } from "@/generated/prisma/client";

const result = await db.$transaction(async (tx) => {
  // 1. Award XP
  const awardResult = await awardXp(tx, userId, {
    source: XpSource.HABIT,
    amount: 15,
    refId: habitId,
  });

  // 2. Touch daily streak
  const streak = await touchStreak(tx, userId);

  // 3. Progress relevant quests (e.g., habit check-in)
  const questsCompleted = await progressQuests(tx, userId, "habit", 1);

  // 4. Check if any new badges unlocked
  const newBadges = await checkBadges(tx, userId);

  return { awardResult, streak, questsCompleted, newBadges };
});
```
