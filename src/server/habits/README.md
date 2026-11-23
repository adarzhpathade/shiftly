# Automatic Habit Analyzer

The Shiftly habit analyzer automatically detects repeating habits from real user activity logged in `ActivityEvent`. Users never add, edit, pick, or check in habits manually. Habits are dynamically computed on read.

---

## 1. Automatic Habit Detection

Habits are discovered from distinct repeating behaviours:
- `trains`: Any scenario completion (`training_finished`).
- `plays-category:<key>`: Scenario completion for a specific training category.
- `clocks-in`: First application open of the day (`daily_open`).
- `boss-fights`: Completed boss challenge sessions (`boss_finished`).
- `completes-quests`: Completed daily quests (`quest_completed`).
- `perfect-scores`: 3-star scenario finishes (`perfect_score`).

### Threshold & Retention
- **Detection**: A habit is discovered when the behaviour occurs on at least **3 distinct days** within the last **14 days** (`HABIT_DETECT_MIN_DAYS = 3`, `HABIT_DETECT_WINDOW_DAYS = 14`).
- **Retention**: A habit stays known as long as any rolling 14-day window in the last **56 days** (`HABIT_FORGET_AFTER_DAYS`) met the detection bar.
- **Usual Days**: Evaluated over the trailing 28 days. A weekday qualifies if hit on $\ge 50\%$ of its dates in the window and at least twice. If none qualify, the top 3 most frequent weekdays are used.
- **Usual Window**: The day part (Morning: 05–12, Afternoon: 12–17, Evening: 17–22, Night: 22–05 in `Asia/Kolkata`) holding $\ge 60\%$ of occurrences, else `null`.

---

## 2. Stages & Progression

A full ISO week (Mon–Sun) counts when the behaviour occurs on $\ge 60\%$ of usual days that week (minimum 1 day).

| Stage | Rule | Stage-Up Bonus |
|---|---|---|
| `forming` | Detected (3+ distinct days in 14), but not yet building | 5 XP |
| `building` | Last 2 full ISO weeks both counted | 15 XP |
| `solid` | Last 4 full ISO weeks all counted AND consistency $\ge 0.8$ | 40 XP |

Stage-up XP bonuses are awarded once per user, habit key, and stage using `HabitStageAward` rows (unique on `[userId, habitKey, stage]`) inside an atomic database transaction with `awardXp`.

---

## 3. Status & Streak Calculation

- **Streaks**: Counted strictly on **usual days** backwards from the most recent usual day. Non-usual days never break a streak. Today counts only if done.
- **Status**:
  - `on_track`: Nothing missed.
  - `slipping`:
    - The most recent usual day before today was missed (streak = 0), OR
    - Today is a usual day, not done yet, and today's usual window has ended (streak preserved until midnight).
  - `fading`: Not seen for $\ge 14$ days (`HABIT_FADING_AFTER_DAYS`). Excluded from `overview.habits` and counted in `fadingCount`. Detail page remains accessible.

---

## 4. Insights & Next Habit Suggestion

- **Insights**:
  - `bestTimeOfDay`: Day part with most training ($\ge 10$ training events on $\ge 5$ days).
  - `mostSkippedWeekday`: Weekday with fewest active days if another has $\ge 2$ more ($\ge 3$ full weeks of history).
  - `skillLink`: Scenario performance comparison on days trained in the best day part vs other days ($\ge 4$ training days in each group, lift $\ge 5\%$).
  - `streakAtRisk`: Nudge when a habit with `currentStreak >= 3` has not been completed today.
- **Next Habit**: Recommends the user's weakest category (lowest mastery, ties broken by fewer stars) not already detected as a `plays-category` habit.
- **New Users**: When `habits` is empty, `firstHabits` progress provides clear guidance toward discovering their first habit.
