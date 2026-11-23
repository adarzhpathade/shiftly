# Activity Logging Engine

Server-side activity tracking subsystem that logs user behaviours into `ActivityEvent` records. These logged events feed automatic habit detection on read.

## Logged Events

- `training_finished`: Logged in `finishAttempt` when a guided scenario is completed (records `categoryId` and `stars`).
- `perfect_score`: Logged in `finishAttempt` alongside `training_finished` when the scenario earns 3 stars.
- `boss_finished`: Logged in `finishSession` upon finishing a boss customer roleplay (records `categoryId`, `stars`, and `{ won }` in `meta`).
- `quest_completed`: Logged in `progressQuests` whenever any daily quest completes (records `{ questId }` in `meta`).
- `daily_open`: Logged on the first app load of the day ("clock in") via `recordDailyOpen(userId)`. Stored at most once per user per `Asia/Kolkata` day; subsequent attempts that day return `recorded: false`. First daily open also advances the "Clock in today" habit quest.

## Architecture & Transactions

- `recordActivity(tx, userId, event)`: Accepts an existing Prisma transaction client, enabling atomic writes alongside training attempts, boss sessions, and quests.
- `realActivityRepo.record(userId, event)`: Wraps `recordActivity` in `db.$transaction`.
- Throws an error for unknown user IDs.
- `stageUps` currently returns an empty list (stage transitions will be evaluated by the habit analyzer).
