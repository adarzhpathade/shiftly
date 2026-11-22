# B5: Scenario content (16 guided scenarios + 4 AI boss customers)

**Owner:** Friend · **Branch:** `feat/scenario-content`

## Goal
Write the training content of the app and the seed script that loads it into the database. This is the heart of Training Mode: the quality of the situations and feedback is what users learn from.

## Read first
- `PROJECT_OVERVIEW.md` sections 5.2 (Training Mode, the 4 categories), 5.2a (Boss level) and 9 (database)
- `AGENTS.md`
- `prisma/schema.prisma` (`Category`, `Scenario`, `ScenarioStep`, `Choice`, `BossPersona`) and `prisma/seed/scenarios/README.md` (the export `prisma/seed.ts` calls). Note: from `prisma/seed/scenarios/index.ts` the Prisma client import path is `../../../src/generated/prisma/client`.
- `src/data/mock/data.ts` (two example scenarios and four example personas: the style to follow)

## Content to write
**Guided scenarios: 4 per category, 16 total.** Categories (already in the database, look them up by slug): `handling-complaints`, `customer-queries`, `difficult-customers`, `problem-solving`.

| Level | Difficulty | Steps | Choices per step |
|---|---|---|---|
| 1, 2 | BEGINNER | 1 | 3 |
| 3, 4 | INTERMEDIATE | 2 (the second step depends on the first answer, via `nextStepId`) | 3–4 |

For every scenario: a title (short, can use one `[bracket]` word, e.g. "The [third] call this week"), the situation (2–3 sentences), the customer's name and message(s), and choices where:
- exactly one is **BEST** (10 points), at least one **OKAY** (5) and one **POOR** (0);
- every choice has **feedback** (1–2 sentences) that explains *why*, and mentions communication (tone, empathy, clarity, ownership) where it fits;
- the situations are realistic for Indian workplaces: e-commerce deliveries, banks, telecom, food delivery, retail stores, travel bookings, utilities. Mix phone, chat and in-person. Respectful, no stereotypes.
- `xpReward`: 40 for Beginner, 60 for Intermediate.

**Boss personas: 1 per category, 4 total** (level 5, the AI live call):
- name, the problem (1–2 sentences), `startMood` (0–100; 10–25 for angry, 40 for confused), `hiddenGoal` (what makes them calm down, e.g. "someone takes ownership and gives a specific time"), `xpReward` 150;
- `systemPrompt`: a character description **in second person** for the AI ("You are Mr. Sharma, 52, a retired bank clerk from Pune…"): personality, how they talk, what they know about their problem, what annoys them, what calms them. Do NOT include scoring rules (the AI engine adds those).
- Suggested: Handling Complaints → a refund that never arrived; Customer Queries → a confused elderly customer with a billing question; Difficult Customers → a rude customer threatening a bad online review; Problem Solving → a business customer whose recurring order keeps failing.

## Build
1. `prisma/seed/scenarios/content.ts`: the content as typed data (one array of scenarios, one of personas). Deterministic ids like `sc-hc-1` … `sc-ps-4`, `step-…`, `ch-…`, `boss-hc`.
2. `prisma/seed/scenarios/index.ts`: `export async function seedScenarios(prisma)` that upserts everything idempotently (running `pnpm db:seed` twice gives the same result, no duplicates).
3. `prisma/seed/scenarios/content.test.ts`: checks the content rules (16 scenarios, 4 per category, levels 1–4, exactly one BEST per step, POOR present, every choice has feedback, every `nextStepId` points to a real step of the same scenario, 4 personas with non-empty prompts).
4. `docs/scenarios.md`: all scenarios and personas in readable form (title, situation, choices with rating and feedback; persona cards). This goes in the report appendix.

## Allowed to touch
`prisma/seed/scenarios/**`, `docs/scenarios.md`. Nothing else.

## Never
`git commit/push/reset/checkout`, print or edit `.env`, change the database schema, touch other folders.

## Done when
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` pass.
- `pnpm db:seed` runs twice without errors, and the database then has 16 scenarios and 4 boss personas (check with `pnpm db:studio`).
- **You read every scenario yourself** and fix anything that sounds unrealistic or robotic. The content is yours; you should be able to explain why each BEST answer is best.
- Report: counts, test results, anything you changed by hand.
