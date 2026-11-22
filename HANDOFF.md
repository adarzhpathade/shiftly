# Session Handoff (2026-11-23)

Read this first in a new session, then `BUILD_PLAN.md` (task board), `PROJECT_OVERVIEW.md` (scope + decisions log) and `AGENTS.md` (Next 16: read `node_modules/next/dist/docs/` before Next-specific code).

## Where things stand
- **User side (employee PWA) is complete in UI**, live at https://shiftly-two-kappa.vercel.app (auto-deploys from `main`; Vercel project `adarz/shiftly`, region `sin1`). Repo: https://github.com/adarzhpathade/shiftly (public).
- Last commit: `c0805ce`. Working tree clean except line-ending noise in `prisma/seed.ts` (no content change; ignore or `git add --renormalize`).
- Checks on main: `pnpm typecheck`, `pnpm lint`, `pnpm test` (216 passing), `pnpm build` all pass. `pnpm test:db` (live Neon checks) and `pnpm test:ai` (one real Groq turn) exist.

| Done | Task |
|---|---|
| Step 1 | F1–F6 foundation: scaffold, data contract + mocks, Prisma/Neon schema + seed, Auth.js roles, UI kit + `/dev/gallery`, PWA shell |
| UI1 | Splash, 3-scene intro, login (demo helper when `NEXT_PUBLIC_DEMO_MODE=1`, local only), register, 2-step setup (buddy + starter habits) |
| UI2 | Home (rebuilt by Sonnet to match `design/style-preview.html`) + `(app)` tab layout |
| UI3/UI4 | Training: categories, level path, scenario player, result |
| UI5 | Habits: list, new/edit, detail with calendar, delete |
| UI6 | Leaderboard: Team/Company, week/all-time, podium, pinned "you" row |
| UI7/UI8 | Profile (buddy sheet, mastery, badges, quests, settings) + 4 celebration overlays (`CelebrationProvider`, `useCelebrate()`) |
| UI10 + B7 | Boss level: AI customer chat with mood meter + judge. Groq `openai/gpt-oss-120b` (reasoning_effort low, ≥1200 tokens) → OpenRouter `:free` → guided fallback. Free-model allowlist, daily budgets, `AI_MODE=mock|real`. Live turn verified (~2 s) |
| B5 | 16 guided scenarios + 4 boss personas in `prisma/seed/scenarios/` (also feed the mocks). Done by an agy worker (reassigned from Khushi) |

## The main gap: persistence
Training, habits, XP, badges, quests and leaderboard still run on **mock data** (`DATA_SOURCE` per repository in `src/data/index.ts`; mock state is in-memory via `globalThis`, so on Vercel it resets and differs between serverless instances). Only auth, onboarding (`onboardedAt`, avatar) and boss sessions use Neon. Consequence: on the live site the boss can stay locked after levels 1–4, and starter habits from setup don't persist.

## Next steps (in order)
1. **B1 + B2** (agy worker): real `TrainingRepository` (attempts, answers, stars, XP events, level unlocks) and real `GamificationRepository` (XP/levels, badges, quests) in `src/server/<domain>/`; wire `seedScenarios(prisma)` from `prisma/seed/scenarios/index.ts` into `prisma/seed.ts`; add a boss-wins stat to `UserStats`.
2. **B3 Habits + B4 Leaderboard backends**: Khushi's tasks (`tasks/friend/01-habits.md`, `02-leaderboard.md`, her own laptop, PRs from `khushichouhan22`). Ask the user whether she has started; if not, an agy worker can take them. `src/server/habits/**` and `src/server/leaderboard/**` are reserved for her.
3. **C1–C4**: switch each repository to real, end-to-end test on the live site.
4. Small follow-ups: show the daily boss limit on page load (now only after "Start call"); real photos + AI 3D renders (`design/ai-render-prompts.md`, swap map `src/components/ui/game-object-sources.ts`); B6 push notifications.
5. **Step 3: Admin/Manager panel** (A1–A4, desktop-first), only after the user side is persisted.
6. Before submission: switch off `NEXT_PUBLIC_INTRO_ALWAYS` (UI review mode, currently `=1` locally and on Vercel), change demo passwords or disable registration, fill `docs/` (README checklist, build log, diagrams, screenshots, viva notes).

## How the user wants work done
- **Opus (main session)**: critical work only, i.e. decisions, briefs and final approval. Short replies. Routine checks/commits go to the cheapest subagent.
- **Sonnet subagents write ALL frontend code** (components, JSX, styling, animation) from the kit (`src/components/ui/` + README) and `design/style-preview.html`. The user rejected agy-written frontend for not matching the design.
- **agy workers do only non-UI work**: backend, server actions, data wiring, tests, DB. Command: `agy -p "Read .agy/briefs/<NAME>.md and do the task exactly." --model gemini-3.8-flash-high --mode accept-edits --settings ".agy/worker-settings.json" --print-timeout 900s`; fixes with `agy -c -p`; escalate to `claude-sonnet-4-6`. Briefs in `.agy/briefs/` (gitignored). The agy quota ran out on 2026-11-23 (429, ~5 h reset); if it fails, the subagent does minimal plumbing itself and says so.
- New art (sticker poses, 3D stand-ins, sparkles) is welcome; it goes in `src/assets/`, exposed through the kit and `/dev/gallery`.
- Phone address-bar colour must match each page (light and dark phone mode): use the kit `ThemeColor` / `useThemeColor`.
- **Max 2 agents at once** (the PC runs low on memory; a dev server was killed once). Each agent runs one server on its own port and stops it. Screenshots: Playwright at 360×800 @2x (`scripts/screens*.ts`), into the session scratchpad.
- Every task: typecheck, lint, test, build, hex/rgb only in `src/styles/` + `src/assets/`, no `next/navigation`/server/data imports in `src/features/`, secret-scan staged diff, commit with `git commit -F`, `git pull --rebase --autostash`, push, confirm the Vercel deploy is Ready (if no deploy appears, `vercel deploy --prod --yes`).
- Cost must stay **₹0**: only free AI models; never print or commit `.env` values. Khushi gets `.env` privately from the user.

## Accounts and services
- Demo logins (password `demo1234`): employee `aarohi@shiftly.demo`, admin `admin@shiftly.demo` (don't share the admin login publicly). More in `prisma/README.md`.
- Neon project `shiftly` (`lively-water-45253969`, Singapore). Groq free plan (1,000 req/day, 8,000 TPM). OpenRouter free (50 req/day backup).
- Vercel env vars set: DATABASE_URL, DIRECT_URL, AUTH_SECRET, GROQ_*, OPENROUTER_API_KEY, AI_BASE_URL, AI_CUSTOMER_MODEL, AI_JUDGE_MODEL, AI_MODE=real, NEXT_PUBLIC_INTRO_ALWAYS=1.

## Open questions for the user
- Buddy names (Sunny, Ace, Bowie, Cappy, Nerdy, Royal) and intro headlines (LEARN / BUILD / LEVEL UP): confirmed or not yet.
- Show the demo-login helper on the live site? (Currently local only.)
- Is Khushi working on B3/B4?
