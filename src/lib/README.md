# lib

Pure, framework-free code shared by frontend and backend. No React or Next imports here.

- `types.ts`: domain **view-model** types (what screens need, not database rows). Dates are ISO strings, colours are token names (`'peach' | 'sky' | 'lav' | 'lime'`), never CSS values. Includes the `Celebration` union for overlays.
- `gamification.ts`: the game rules, with tests in `gamification.test.ts`.
  - Level curve: total XP to reach level L = `250 * (L-1) * L / 2` (L2 = 250, L3 = 750, L4 = 1500, L5 = 2500). `xpForLevel`, `levelForXp`, `progressToNextLevel` (for the XP bar).
  - Stars: `starsForScore` (>= 90% 3, >= 60% 2, else 1). XP: `guidedXp(stars, base)` pays 50% / 75% / 100%; `replayXp` pays only the improvement over the previous best.
  - Streaks: `streakAfterCheckIn(lastDate, today, current, daysOfWeek?)` (with a schedule, only scheduled days count) handles first, same day, consecutive day and gap; `streakMilestone` detects 7 / 30 / 100. Dates are `"YYYY-MM-DD"` (`toISODate`, `addDays`, `daysBetween`).

Data access lives in `src/data/`; backends and mocks both use these functions so results match.
Constants: BOSS_DAILY_LIMIT = 10, MAX_BOSS_TURNS = 8, MAX_REPLY_CHARS = 400 (in gamification.ts).
