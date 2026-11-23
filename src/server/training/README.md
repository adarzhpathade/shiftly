# Shiftly Training & Home Backend (M2)

This module provides real database-backed implementations for guided customer service training scenarios and the employee Home dashboard.

---

## 1. Mechanics & Rules

### Scoring
- Each guided scenario step presents 3–4 response choices.
- Choices are rated `best`, `okay`, or `poor` with assigned point values (e.g., 25, 10, 0).
- Step max points: $\max(\text{choice points for that step})$.
- Attempt score: $\sum \text{selected choice points}$.
- Attempt max score: $\sum \text{step max points}$.

### Stars
Stars are awarded upon completing all scenario steps according to the percentage achieved:
- **3 Stars ($\star\star\star$):** $\ge 90\%$ ($\ge 0.90 \times \text{maxScore}$)
- **2 Stars ($\star\star$):** $\ge 60\%$ and $< 90\%$
- **1 Star ($\star$):** $< 60\%$ on finished attempt
- **0 Stars:** Incomplete / in-progress attempt

### Best-Score Replay XP Rule
XP awards for guided scenarios follow the rule that replays only pay the improvement over previous best performance (`replayXp` in `src/lib/gamification.ts`):
- First completion:
  - 3 Stars: $100\%$ of base `xpReward`
  - 2 Stars: $75\%$ of base `xpReward`
  - 1 Star: $50\%$ of base `xpReward`
- Replays:
  $$\text{xpEarned} = \max(0, \text{guidedXp}(\text{newStars}, \text{base}) - \text{guidedXp}(\text{previousBestStars}, \text{base}))$$
- Replaying with equal or fewer stars pays $0\text{ XP}$.

### Unlock Rules
Every category features 5 levels (Levels 1–4 Guided Scenarios, Level 5 Boss AI Live Call):
- **Level 1:** Always unlocked.
- **Levels 2, 3, 4:** Unlocks when the preceding level has achieved at least 1 star ($\text{stars} \ge 1$).
- **Level 5 (Boss):** Unlocks when Levels 1 through 4 have all achieved at least 1 star.

### Today's Challenge
- Highlighting scenario `sc-hc-3` ("Double charge").
- Offers $+25\text{ XP}$ bonus on the first completion of the day (evaluated in `Asia/Kolkata` timezone).

---

## 2. Repositories

### `TrainingRepository` (`src/server/training/repository.ts`)
- `listCategories(userId)`: Returns all 4 categories with user-specific progress (stars, levels completed, mastery).
- `getLevelPath(userId, categoryKey)`: Returns the 5-node progression path with lock states and user's best stars.
- `getGuidedScenario(scenarioId)`: Delivers the scenario text, situation, customer persona, and steps/choices **without leaking ratings, points, or feedback**.
- `startAttempt(userId, scenarioId)`: Initializes a new `Attempt` in the database with `score: 0`, `stars: 0`, `finishedAt: null`.
- `answerStep(userId, attemptId, stepId, choiceId)`: Enforces that the attempt is unfinished and steps are answered in order; persists `AttemptAnswer` and returns `AnswerResult`.
- `finishAttempt(userId, attemptId)`: Calculates score, stars, replay XP, marks `finishedAt`, and in a single transaction updates progress, quests, badges, and streaks.

### `HomeRepository` (`src/server/home/repository.ts`)
- `getHome(userId)`: Compiles full `HomeData` (user summary, streak, level progression, Today's Challenge, next unlocked `continueTraining` node, categories, habits, and daily quests).
