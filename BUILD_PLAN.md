# Build Plan

Live task board for building **shiftly** (placeholder name). Scope and design decisions live in `PROJECT_OVERVIEW.md`; this file tracks *who builds what* and *where it stands*.

## Team and roles

| Level | Who | Does |
|---|---|---|
| Lead + watcher | Claude Opus (main session) | Plans, writes briefs, reviews every result, keeps this file updated |
| Frontend leads | Claude subagents: Sonnet (screens, components), Haiku (mechanical tasks) | All frontend; brief and check their own agy workers |
| Workers | `agy` CLI workers | Backend and frontend↔backend connection |
| Owners | **Adarsh** (repo owner), **Friend** (backend tasks marked *Friend*) | Owner = whose account commits the work |

Friend's tasks are run by her from her own laptop with the same agy briefs (in `tasks/friend/`), on her own branch, merged through a pull request after review.

## Status key
`todo` · `in progress` · `review` · `done` · `blocked`

## Step 0: Preflight
| ID | Task | Executor | Owner | Status |
|---|---|---|---|---|
| P1 | Tool check (node 24, npm 11, git, gh, agy) | Opus | Adarsh | done |
| P2 | agy worker test (headless, permissions) | Opus | Adarsh | done, see Worker setup |
| P3 | `git init`, `.gitignore`, first commit | Opus | Adarsh | done |
| P4 | Create public GitHub repo, add Friend (GitHub `khushichouhan22`) as collaborator | Opus | Adarsh | todo (after Step 1) |

## Step 1: Foundation (sequential, reviewed before Step 2)
| ID | Task | Executor | Owner | Status |
|---|---|---|---|---|
| F1 | Next.js (App Router, TS strict) scaffold, Tailwind with design tokens from `design/style-preview.html`, Bricolage Grotesque, ESLint, Prettier, Vitest | Sonnet | Adarsh | done (Next 16.4.6, React 19.3, Tailwind 4.3, TS 5.9) |
| F2 | **Shared contract**: domain types (`src/lib/types.ts`), repository interfaces, mock implementations with fake delay, `src/data/index.ts` switch (mock or real) | Sonnet, reviewed by Opus | Adarsh | done (59 tests) |
| F3 | Prisma schema (all tables from overview section 9), Neon Postgres, first migration, demo company seed (1 company, 4 teams, ~20 users) | agy under Sonnet | Adarsh | done (Prisma 7.10.1, 20 models, migration init, seed verified) |
| F4 | Auth: Auth.js credentials login, roles (Employee / Manager / Admin), route protection | agy under Sonnet | Adarsh | done (Auth.js v5 beta, JWT, proxy.ts) |
| F5 | UI kit from the style preview: buttons, pills, chips, cards, bracket headline, tab bar, sticker buddy (3 poses), 3D object placeholders (swappable for AI renders), XP bar, mastery ring | Sonnet | Adarsh | done (19 components, /dev/gallery) |
| F6 | PWA shell: manifest, icons, service worker (Serwist), install prompt | Sonnet | Adarsh | done (hand-written sw.js, generated PNG icons) |
| F7 | Dev **Screen Gallery** route (`/dev/gallery`) listing every screen and state | Haiku | Adarsh | merged into F5 |

## Step 2: Features (parallel, max 3 workers at a time)

### Frontend (screens built against mock data)
| ID | Task | Executor | Owner | Status |
|---|---|---|---|---|
| UI1 | Splash, intro story (3 scenes), login / register, setup (avatar + starter habits) | Sonnet | Adarsh | todo |
| UI2 | Home | Sonnet | Adarsh | todo |
| UI3 | Training: categories, level path | Sonnet | Adarsh | todo |
| UI4 | Training: scenario player, result | Sonnet | Adarsh | todo |
| UI5 | Habits: list, add / edit, detail (heatmap) | Sonnet | Adarsh | todo |
| UI6 | Leaderboard (Team / Company, weekly / all time, podium) | Sonnet | Adarsh | todo |
| UI7 | Profile (badges, progress charts) and Settings | Sonnet | Adarsh | todo |
| UI8 | Celebration overlays: LEVEL UP, NEW BADGE, STREAK!, PERFECT | Sonnet | Adarsh | todo |
| UI10 | Boss level: live call chat (streaming replies, typing indicator, mood meter, quick-reply chips) and boss result screen | Sonnet | Adarsh | todo |
| UI9 | Offline and 404 pages | Haiku | Adarsh | todo |

### Backend (implements the F2 contract)
| ID | Task | Executor | Owner | Status |
|---|---|---|---|---|
| B1 | Scenario engine: attempts, step answers, scoring, stars, best-score XP rule | agy under Sonnet | Adarsh | todo |
| B2 | Gamification: XP events, levels, badge rules, daily quests, Today's Challenge | agy under Sonnet | Adarsh | todo |
| B3 | **Habits**: create / edit / delete, check-in, streak calculation | agy (run by Friend) | **Friend** | todo, waits on F2–F4 |
| B4 | **Leaderboard**: weekly / all-time XP, Team / Company, "your rank" | agy (run by Friend) | **Friend** | todo, waits on F2–F4 |
| B5 | **Scenario content**: 16 guided scenarios (4 categories × 4) + 4 boss personas + seed script | agy (run by Friend) | **Friend** | todo, waits on F3 |
| B6 | Web push: habit reminders, streak-at-risk, new assignment | agy under Sonnet | Adarsh | todo |
| B7 | **AI roleplay engine**: provider chain Groq `gpt-oss-120b` (customer + judge in one structured call) → OpenRouter (ERNIE customer + Decider Flash judge) → multiple-choice fallback; `AI_MODE=mock|real`; free-model guard; daily request budget; customer persona, judge, mood meter, win / lose rules, daily limits, safety, fallback to multiple choice, streaming endpoint | agy under Sonnet | Adarsh | todo (keys in `.env`) |

### Connection (swap mock → real, one feature at a time)
| ID | Task | Executor | Owner | Status |
|---|---|---|---|---|
| C1 | Auth + onboarding | agy under Sonnet | Adarsh | todo |
| C2 | Training (B1 + B2 + B7) | agy under Sonnet | Adarsh | todo |
| C3 | Habits (B3) | agy under Sonnet | Adarsh | todo |
| C4 | Leaderboard, Profile (B2 + B4) | agy under Sonnet | Adarsh | todo |

## Step 3: Manager / Admin panel (desktop-first)
| ID | Task | Executor | Owner | Status |
|---|---|---|---|---|
| A1 | Admin APIs: users, teams, scenarios, badges, habit templates, assignments | agy under Sonnet | Adarsh | todo |
| A2 | Team dashboard + member detail | Sonnet | Adarsh | todo |
| A3 | Scenario editor | Sonnet | Adarsh | todo |
| A4 | Users / teams, badges / templates, assignments screens | Sonnet | Adarsh | todo |

## Step 4: Polish and ship
| ID | Task | Executor | Owner | Status |
|---|---|---|---|---|
| S1 | Swap stand-in 3D objects for AI renders, add stock photos | Haiku | Adarsh | todo, waits on renders |
| S2 | PWA polish: offline check-in sync, install flow, Lighthouse PWA pass | Sonnet | Adarsh | todo |
| S3 | End-to-end tests of main flows (Playwright) | Sonnet | Adarsh | todo |
| S4 | Deploy to Vercel (production) | Opus | Adarsh | todo |

## Step 5: College submission
| ID | Task | Owner | Status |
|---|---|---|---|
| D1 | Project report | Adarsh + Friend | todo |
| D2 | Diagrams: ER, DFD, use case, flow | Adarsh + Friend | todo |
| D3 | Presentation (PPT) | Adarsh + Friend | todo |

---

## Rules every brief includes
1. **Screens never fetch or navigate on their own.** Screens live in `src/features/<feature>/` and get data through props and report actions through callbacks. Only route files in `src/app/` wire them to data and navigation.
2. **Data only through the contract** in `src/data/`. Frontend uses mocks until the matching Connection task.
3. **No colours outside the theme.** No hex, `rgb()` or named colours outside `src/styles/` (tokens) and `src/assets/`.
4. **Backend code lives in `src/server/<domain>/`.** Friend's domains: `src/server/habits/`, `src/server/leaderboard/`, `prisma/seed/scenarios/`.
5. **Workers never** run `git push`, `git reset`, delete files outside their task, touch `.env` secrets, or change files outside their allowed list.

## Watcher checklist (after every task)
1. `git status` and diff review: only allowed files changed.
2. `npx tsc --noEmit`: 0 errors.
3. `npm run lint`: 0 errors.
4. `npm test`: passes.
5. Colour grep: no hex / `rgb(` / named colours outside the theme.
6. Contract check: backend results match `src/lib/types.ts`.
7. Visual check: screenshot at 360×800 compared with `design/style-preview.html`. Use Playwright device emulation (headless Edge has a ~500px minimum window width and crops narrower shots).
8. Pass → local commit. Fail → short fix brief; after 2 failed retries the task is `blocked` and goes to Adarsh.

## Worker setup (from preflight, 2026-11-22)
- `agy` models available: Gemini 3.8 Flash (low / medium / high), Claude Sonnet 4.6, Claude Opus 4.6, GPT-OSS 120B.
- Auto mode is **not available** on this account. `--mode accept-edits` allows file edits.
- Headless command permission rules only match **exact** command lines; the only wildcard is `command(*)` (all commands).
- `--sandbox` breaks `npm` and does not stop writes outside the folder, so it is not used.
- Decision on command permissions (Adarsh, 2026-11-22): **Option B**. Workers run with `--mode accept-edits` and a settings file allowing `command(*)`. Guardrails: git checkpoint before every worker run, full diff review after, briefs forbid `git push` / `git reset` / deleting or writing outside the allowed paths, and the watcher reports anything harmful or unexpected to Adarsh immediately.

## Setup decisions (Adarsh, 2026-11-22)
- Package manager: **pnpm**
- Database: **new Neon project** on Adarsh's account, Singapore region, created through the Neon connector. Created 2026-11-22: project `shiftly`, Postgres 18, database `shiftly`; `DATABASE_URL` (pooled) and `DIRECT_URL` (direct, for migrations) are in `.env`
- Deploy: **Vercel from Step 1** (live HTTPS link early for PWA testing)
- GitHub repo: **public**, named **shiftly**

## Worker brief template
```
Task: <ID and one-line goal>
Read first: PROJECT_OVERVIEW.md (sections …), BUILD_PLAN.md (Rules), <files>
Build: <files to create or change>
Contract: <types / interfaces to implement or use>
Allowed to touch: <exact paths>
Do not touch: everything else
Done when: tsc clean, lint clean, tests pass, <task-specific checks>
Report: files changed, commands run, anything unfinished
```
