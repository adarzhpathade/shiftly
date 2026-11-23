# Contract: automatic habits and password reset

Status: contract, schema and mocks are done (2026-11-23). Real backends are not built yet.
Owners: **Khushi** = habits (`HabitRepository` detection), **Mayur** = activity logging, password reset, weekly coach note, register team list.
UI work builds against the mocks (`DATA_SOURCE=mock`, the default).

Source of truth in code:

| What | Where |
|---|---|
| Types | `src/lib/types.ts` (sections "Habits", "Activity", "Password reset", "Registration") |
| Interfaces | `src/data/repositories.ts`: `HabitRepository`, `ActivityRepository`, `PasswordResetRepository` |
| Thresholds and pure helpers | `src/lib/habits.ts`, `src/lib/password-reset.ts` (use these constants; do not copy numbers) |
| Prisma | `prisma/schema.prisma`, migration `20261123085330_auto_habits_and_password_reset` (already applied to dev) |
| Mocks | `src/data/mock/habits.ts`, `activity.ts`, `password-reset.ts`; wired in `src/data/index.ts` |
| Server actions (thin) | `src/server/auth/password-reset-actions.ts` |

Do not change the interfaces or types without asking the lead.

---

## 1. Habits are automatic

Users never add, edit, pick or check in habits. The app logs what they do and **discovers** habits from repeating behaviour. They just appear. There is no manual check-in XP any more.

### 1.1 Activity events (what is logged)

`ActivityRepository.record(userId, event)` is internal (server code only). Callers:

| Event | Logged when | Caller |
|---|---|---|
| `training_finished` (categoryKey, stars) | A guided scenario is finished | training `finishAttempt` |
| `perfect_score` (categoryKey) | The same attempt got 3 stars (log both events) | training `finishAttempt` |
| `boss_finished` (categoryKey, won, stars) | A boss session is finished (won or lost) | boss `finishSession` |
| `quest_completed` (questId) | A daily quest completes | progress `progressQuests` |
| `daily_open` | First app open of the day ("clocked in") | a server action fired by the app shell on first load of the day |

Rules:
- `at` is optional (defaults to now); only backfills and tests pass it.
- Only the **first `daily_open` per day** is stored (check inside the same transaction). Later calls return `recorded: false`.
- `record` stores the event, re-detects the habits the event can affect, and pays stage-up XP (section 1.5). It must never throw into the caller's flow: log the error and return `{ recorded: false, stageUps: [], xpEarned: 0 }`.
- The result's `stageUps` and `leveledUp` are meant to be merged into the celebrations the caller already returns (`buildCelebrations({ stageUps })`, a `habit-stage` celebration exists).
- Storage: `ActivityEvent` (userId, type, categoryId?, stars?, meta Json?, createdAt). `meta` holds `{ won }` for boss and `{ questId }` for quests. Time of day comes from `createdAt` in the app timezone (`Asia/Kolkata`, `src/lib/time.ts`).

### 1.2 Detecting a habit

Habits are **computed on read** from `ActivityEvent`. Nothing is stored except `HabitStageAward`.

A **behaviour** is one of these (`HabitKind`), with a stable `key` (`habitKeyFor` in `src/lib/habits.ts`):

| kind | key | counts these events | example title |
|---|---|---|---|
| `trains` | `trains` | `training_finished` (any category) | "Trains on weekday evenings" |
| `plays-category` | `plays-category:<categoryKey>` | `training_finished` of that category | "Plays Difficult Customers 3x a week" |
| `clocks-in` | `clocks-in` | `daily_open` | "Clocks in every morning" |
| `boss-fights` | `boss-fights` | `boss_finished` | "Takes on boss customers" |
| `completes-quests` | `completes-quests` | `quest_completed` | "Finishes daily quests" |
| `perfect-scores` | `perfect-scores` | `perfect_score` | "Aims for 3 stars" |

**A habit appears when** the behaviour happened on **at least 3 distinct days within the last 14 days** (`HABIT_DETECT_MIN_DAYS`, `HABIT_DETECT_WINDOW_DAYS`). Distinct days, so three scenarios in one evening do not count. Once detected, a habit stays "known" while any rolling 14-day window in the last 56 days (`HABIT_FORGET_AFTER_DAYS`) met that bar; after that it is forgotten.

**Usual days** (`usualDays`): look at the last 28 days. A weekday is usual when the behaviour happened on at least 50% of that weekday's dates in the window and at least twice. If none qualifies, use the 3 most frequent weekdays.

**Usual window** (`usualWindow`): the day part (`DAY_PARTS`: morning 05-12, afternoon 12-17, evening 17-22, night 22-05, app timezone) holding at least 60% of occurrences, else `null` (no fixed time).

**Title and description** are built from the kind, usual days and window (rules-based text; no AI needed). Icon: any key from `src/lib/habit-icons.ts` (suggested: trains `book`, plays-category `megaphone`/category icon, clocks-in `clock`, boss-fights `rocket`, completes-quests `check`, perfect-scores `target`).

### 1.3 Stage, status, streak, consistency

A "week counts" when the behaviour happened on at least 60% of the usual days that week (minimum 1 day; `HABIT_WEEK_ON_TRACK_SHARE`). Weeks are full ISO weeks (Mon to Sun) before the current one; the current week is judged once it is over.

**Consistency** (0 to 1) = usual days hit / usual days, over the last 4 weeks (`HABIT_CONSISTENCY_WEEKS`).

| Stage | Rule |
|---|---|
| `forming` | Detected (3+ distinct days in 14), but not yet building |
| `building` | The last **2** full weeks both counted (`HABIT_BUILDING_WEEKS`) |
| `solid` | The last **4** full weeks all counted AND consistency >= **0.8** (`HABIT_SOLID_WEEKS`, `HABIT_SOLID_MIN_CONSISTENCY`) |

Stages can fall back (solid to building) if the conditions lapse; the XP for a stage is still paid only once (1.5). Why these numbers: 2 weeks is the shortest span that shows "repeats", 4 weeks matches the usual "a month makes a habit" idea and the 12-week heatmap shows it clearly, and 0.8 allows about one miss a month for a daily habit.

**Streak** = consecutive **usual days** the behaviour was seen, counting back from the most recent usual day. Non-usual days never break a streak (extra days are a bonus). Today counts only if it was done; a usual today that is not done yet does not break it until the window passes. `bestStreak` is the longest such run in the data.

**Status**
- `on_track`: nothing missed.
- `slipping`: the most recent usual day (before today) passed without the behaviour, **or** today is a usual day, the usual window has ended (no window = end of day does not apply) and it was not done. If a past usual day was missed, `currentStreak` is 0 (broken). If only today's window passed, the streak is still shown and will break at midnight.
- `fading`: not seen for **14+ days** (`HABIT_FADING_AFTER_DAYS`). Fading habits are **left out of `HabitsOverview.habits`** and only counted in `fadingCount`. `getDetail` still works for them. Seeing the behaviour 3 times in 14 days again brings it back (as `forming` or higher by the rules above).

`doneToday` = behaviour seen today. `heatmap` = last 84 days, oldest first, `count` per day. `lastSeenAt` = time of the last occurrence.

### 1.4 Next habit, insights, new users

**Next habit to form** (`nextHabit`): exactly one suggestion. Take the user's weakest training category (lowest `mastery`, ties by fewer stars) that does not already have a detected `plays-category` habit. Title like "Play Difficult Customers Mon/Wed/Fri" (3 spaced weekdays, pick ones that fit the user's usual days if any). It tracks itself: `occurrences` = distinct days of that behaviour in the last 14 days, `progress` = occurrences / 3. When it reaches 3 it becomes a normal detected habit and the next suggestion is chosen. `null` when there is no training data yet.

**Insights** (`HabitInsights`): each field is `null` when the data is too thin.

| Field | Needs | Meaning |
|---|---|---|
| `bestTimeOfDay` | at least 10 training events on at least 5 days | the day part with most training |
| `mostSkippedWeekday` | at least 3 full weeks of data | the weekday with the fewest active days, if another weekday has at least 2 more |
| `skillLink` | at least 4 training days in each group | compares average score on days trained in the best day part vs other days; shown only when the difference is >= 5%; `liftPercent` = round((a - b) / b * 100). Text: "On days you train in the morning your scores are 12% higher." |
| `streakAtRisk` | a habit with `currentStreak >= 3` that is not done today | text nudge naming the habit and its usual window |

**New users:** while `habits` is empty, `firstHabits` is set: `progress` = best candidate's distinct days / 3 (capped at 1), plus `occurrences`, `needed` (3) and a friendly `hint`. Home gets the same value as `HomeHabits.firstHabitsProgress`. With no events at all, `progress` is 0. Once a habit exists, `firstHabits` is `null`.

### 1.5 Stage-up XP (HabitStageAward)

When an event makes a habit reach a new stage, `record` pays a small bonus once per user, habit and stage: `HABIT_STAGE_XP` = forming 5, building 15, solid 40. A `HabitStageAward` row (unique on userId + habitKey + stage) makes this idempotent, so a habit that slips back and returns does not pay twice. The bonus is an `XpEvent` with `source: HABIT` and `refId: "<habitKey>:<stage>"`. The response carries `stageUps` (with `xpBonus`) and an optional `leveledUp`.

### 1.6 Weekly coach note

`getCoachNote(userId)` returns 3 short lines (about 90 characters each) for the current ISO week (`isoWeekKey`, e.g. "2026-W48").
- Cached in `CoachNote`, unique per user per ISO week. First read of the week generates it; later reads return the cache.
- Generated by AI through the existing free Groq setup in `src/server/boss/` (free models only, zero cost, short timeout, strict 3-line output). The input is the computed overview (habits, stages, slipping, insights), never raw chat.
- On any failure, or too little data, use the plain **rules-based fallback** text and store it with `source = "rules"`. A `rules` row from earlier the same week may be replaced by an AI note on a later read (at most one retry per hour).
- `getOverview` includes the same note, so the page needs one call.

### 1.7 What the screens call

| Screen | Call |
|---|---|
| Habits page | `habitRepo.getOverview(userId)` (one call: habits, `fadingCount`, `nextHabit`, `insights`, `coachNote`, `firstHabits`) |
| Habit detail `/habits/[key]` | `habitRepo.getDetail(userId, key)` (throws "Habit not found" for an unknown key) |
| Home | `homeRepo.getHome(userId).habits` (`HomeHabits`: up to 3 items, slipping first, `firstHabitsProgress`, `slippingCount`) |

Home's old "today's habits" with check-in boxes is gone. The "habit" daily quest is now a behaviour quest (mock: "Clock in today"). The real quest definition in `src/server/progress/quests.ts` still says "Check in 3 habits": Mayur must change it (for example to "Clock in today", completed by `daily_open`).

### 1.8 Mock behaviour (for UI work)

- Demo user: 3 visible habits (solid "Clocks in every morning", building+slipping "Trains on weekday evenings", forming "Plays Handling Complaints 3x a week"), 1 hidden fading habit (`boss-fights`, reachable via detail), all four insights, next habit "Play Difficult Customers Mon/Wed/Fri" at 1 of 3, an AI-style coach note.
- New-user variant: user id starting `u-new` or `u-brand-new`, or env `MOCK_HABITS_VARIANT=new`. No habits, `firstHabits` at 1 of 3, all insights `null`, a `rules` coach note.
- The mock `ActivityRepository.record` only stores events (and advances the "Clock in today" quest on `daily_open`); it never changes the demo habits.

---

## 2. Forgot password with an email code

Flow: screen asks for email, then `requestResetCodeAction(email)`; screen asks for the code and new password, then `resetPasswordAction(email, code, newPassword)`; on `ok` go to `/login`. Route: `/forgot-password` (already public in `src/proxy.ts`). Server actions live in `src/server/auth/password-reset-actions.ts` and are thin wrappers over `PasswordResetRepository`.

| Method | Results |
|---|---|
| `requestCode(email)` | `{ ok: true }` for any well-formed email, known or not. `{ ok: false, reason: "invalid", field: "email" }` for a malformed email. `{ ok: false, reason: "rate-limited", retryAfterSeconds }` |
| `verifyAndReset(email, code, newPassword)` | `{ ok: true }`; `invalid` (with `field`: `email` / `code` / `newPassword`, `message`, optional `attemptsLeft`); `expired`; `too-many-tries`; `rate-limited` |

Rules (constants in `src/lib/password-reset.ts`):
- The code is **6 digits**, random, sent by **Gmail SMTP** with an app password. Env vars: `GMAIL_USER`, `GMAIL_APP_PASSWORD`. Use nodemailer (or similar) from a server-only module; never log the code or the credentials.
- Stored **hashed** in `PasswordResetCode.codeHash` (use a keyed or slow hash; the code space is small, so the attempt limit is what protects it). Single use (`usedAt`). A new request invalidates earlier unused codes for that user.
- **Expires after 15 minutes.** Max **5 wrong tries per code**; the 5th wrong try burns it (`too-many-tries`, ask for a new code).
- Max **3 code requests per email per rolling hour**.
- **Never reveal whether an account exists.** For an unknown email, answer `ok` as usual; for symmetry insert a "ghost" row (`userId = null`, `usedAt` set) so the hourly limit counts the same for known and unknown emails (this is why `PasswordResetCode` has an `email` column and a nullable `userId`). Verifying against an unknown email returns `invalid` (field `code`), same as a wrong code.
- New password: at least 8 characters (same as registration), hashed with the same function as registration (`src/server/auth/core.ts`). After success, no session is created; the user logs in.
- Mock: the code is always `123456`, no email is sent, no password changes. Branches: 4th request in an hour = `rate-limited`; 5 wrong codes = `too-many-tries` (a new request resets it); emails starting `expired`, `locked`, `limited` return `expired`, `too-many-tries`, `rate-limited` directly; a new password under 8 characters = `invalid` (field `newPassword`); malformed email = `invalid` (field `email`).

---

## 3. Register as an "employee ID card" and a playful login (UI only)

No new backend. The screens need:
- **Team list** for the card: `listTeamsForRegistration()` in `src/server/auth/actions.ts` now returns `RegistrationTeam[]` = `{ id, name, memberCount? }`. `memberCount` is optional until Mayur adds it (a count of users per team); screens must handle it being missing. The register page already loads the list server-side and passes it down (`teams` prop).
- Everything else on the card is cosmetic and can be derived client-side: buddy avatar preview, the typed name, a decorative employee number (for example from the email hash), the joined date (today).
- Registration fields are unchanged (`registerSchema`: name, email, password >= 8, teamId). Setup after register is now **buddy only** (no starter habits); `completeOnboardingAction({ avatarKey })`.
- Login stays `loginAction`. Add a "Forgot password?" link to `/forgot-password`.

---

## 4. Prisma (additive only)

Added (nothing dropped or renamed; the live site still reads the old tables):

| Model | Purpose |
|---|---|
| `ActivityEvent` | userId, type (`ActivityType` enum), categoryId?, stars?, meta Json?, createdAt. Index (userId, createdAt) |
| `PasswordResetCode` | userId? (null for unknown emails), email, codeHash, expiresAt, attempts, usedAt?, createdAt. Indexes userId, (email, createdAt) |
| `CoachNote` | userId, isoWeek, text (3 lines joined by a line break), source (`ai`/`rules`), createdAt. Unique (userId, isoWeek) |
| `HabitStageAward` | userId, habitKey, stage (`HabitStageName`), xp, awardedAt. Unique (userId, habitKey, stage). Justified because stage-up XP must be paid once even though habits are computed, not stored |

`Habit`, `HabitLog`, `HabitTemplate` (and the `Frequency` enum) are marked `/// DEPRECATED: manual habits removed; kept for live-site compatibility`. The old real code in `src/server/habits/` is not wired in any more (see its header comment); its types live in `src/server/habits/legacy-types.ts`. Delete both once the new repository ships and the live site stops reading the old tables.

Detected habits are **not** stored. Compute them from `ActivityEvent` rows for the last 12 weeks (84 days) plus the 56-day known window; one indexed range query per user is enough.

---

## 5. Removed from the old manual model

`HabitInput`, `HabitTemplate`, `Habit`, `CheckInResult`, `HabitFrequency` (now only in `src/server/habits/legacy-types.ts`), `HabitRepository.listToday/listTemplates/create/update/remove/checkIn`, the add/edit habit routes, check-in server actions, and the starter-habits step in setup. `UserStats.habitCheckIns` stays only for the live site (always 0 for new users).
