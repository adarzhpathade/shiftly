# Weekly Coach Note Engine

Subsystem that generates and caches the weekly 3-line coach note for each user.

Note: `HabitRepository.getCoachNote` in `src/server/habits/` should delegate to `getCoachNote` exported from `src/server/coach/index.ts`.

## Architecture

- `summary.ts`: Pure function converting trailing 14-day `ActivityEvent` records into a concise fact sheet (active days, categories finished, average stars, boss outcomes, perfect scores, quests completed, Kolkata day-part peak, weekly change, weakest category).
- `rules.ts`: Pure rules-based generator producing 3 friendly, short lines (<= 90 characters each, no emojis), plus a dedicated empty-week line set matching mock behavior.
- `ai.ts`: Calls the free model provider chain (Groq `openai/gpt-oss-120b` -> OpenRouter free fallback) using only the fact sheet numbers (zero PII), subject to an 8-second timeout, budget check, and strict length/emoji validation.
- `index.ts`: `getCoachNote(userId)` orchestrates DB caching per ISO week in `CoachNote`, daily attempt limits, and upgrade from rules to AI.
