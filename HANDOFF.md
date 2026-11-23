# Session Handoff (2026-11-23, evening)

Read this first in a new session, then `BUILD_PLAN.md` (task board), `PROJECT_OVERVIEW.md` (scope + decisions log), `docs/contract-auto-habits.md` (auto-habits + password reset rules) and `AGENTS.md` (Next 16: read `node_modules/next/dist/docs/` before Next-specific code).

## Where things stand
- **User app: feature-complete on real data, waiting for the user's own end-to-end test.** Live: https://shiftly-two-kappa.vercel.app (auto-deploys from `main`; Vercel `adarz/shiftly`, region `sin1`). Repo: https://github.com/adarzhpathade/shiftly.
- **The user and friends test it themselves, creating accounts with their own emails. Do NOT test it for them**; wait for their bug reports.
- Production runs on real data: `DATA_SOURCE=real` is set on Vercel (2026-11-23).
- **Deploy only by `git push` to main, never `vercel deploy` from this PC.** A CLI deploy once baked the local `.env` (`NEXT_PUBLIC_DEMO_MODE=1`) into production. A `.vercelignore` now blocks `.env*`.
- Small cleanup: the auto-habits comment block in `src/data/index.ts` still says "No real implementations exist yet". It's stale.
- Checks on main: `pnpm typecheck`, `pnpm lint`, `pnpm test` (~350), `pnpm build` pass. `src/server/habits/repository.test.ts` is a real-DB test that can time out on a cold Neon; re-run it alone.

## Done today
| Area | What |
|---|---|
| Backend (friends) | B4 leaderboard + B3 old habits (Khushi), M1 progress engine/gamification + M2 training/home (Mayur), B8 habit analyzer (Khushi, PR #5) |
| Backend (agy workers, supervised by Sonnet) | W1 activity log + hooks (training, boss, quests, daily open; "Clock in today" quest), W2 forgot password (6-digit email code via Gmail SMTP: hashed, 15 min, 5 tries, 3/hour, no account leak), W3 weekly coach note (Groq free models, numbers-only prompt, cached per ISO week, rules fallback) |
| Contract | Habits are fully automatic: discovered from `ActivityEvent` (3 days in 14 = detected; forming → building → solid; slipping/fading; insights; next habit to form). No manual add/edit/check-in. Additive migrations only |
| UI (Sonnet) | Loaders (ShiftLoader "Shift Change", tinted Shimmer, Button `loading`, TypingBubble, context loaders); playful login ("Clock in to your [shift]", reacting buddy); register as an employee ID card stamped HIRED; `/forgot-password`; new Habits page, habit detail and Home habits strip |
| Review fixes (lead) | Removed "fallback to first employee" in leaderboard and habits (twice), team leaderboard excludes managers, double-finish XP guard in training |

## Known gaps / next steps (in order)
1. **Wait for the user's test results**, then fix the reported bugs (Sonnet for UI, agy workers for backend).
2. **Glue (small):**
   - `HabitRepository.getCoachNote` in `src/server/habits/repository.ts` still returns the rules fallback: make it delegate to `getCoachNote` from `@/server/coach`.
   - Stage-up XP is paid when the Habits page is read (`getOverview`), not when activity happens. `ActivityRecordResult.stageUps` is still empty (`TODO(habits)` in `src/server/activity/repository.ts`). Wire the stage check into activity recording.
3. The `src/data/index.ts` header comment and the `DATA_SOURCE=real` warning are stale (every repo is real now).
4. Polish:
   - show the daily boss limit on page load;
   - push notifications (now "streak at risk" / "habit slipping");
   - PWA offline + install;
   - real photos/3D renders (`design/ai-render-prompts.md`, `src/components/ui/game-object-sources.ts`);
   - Playwright e2e.
5. **Admin/Manager panel** (A1–A4, desktop-first). Suggested split: Khushi = users/teams/assignments + team dashboard data; Mayur (or agy workers if he's away) = content (scenarios, badges, templates).
6. Before submission:
   - set `NEXT_PUBLIC_INTRO_ALWAYS` off;
   - change demo passwords or close registration;
   - fill `docs/` (report, diagrams ER/DFD/use case, PPT, viva notes).

## People
- **Khushi** (`khushichouhan22`): Antigravity app (Gemini 3.8 Flash) on her laptop, continuing in the same chat. She receives full prompts that cover setup, the task, checks, commit, push and `gh pr create`. Briefs live in `tasks/friend/`. She has twice added a "fall back to another user" shortcut: always check for it.
- **Mayur** (`mayur007y`): currently away. His briefs are in `tasks/mayur/`, and agy workers ran his work instead. His git email is now his real one.

## How the user wants work done
- **Opus (main session):** decisions, briefs, final approval only. Short replies.
- **Delegate everything else to the cheapest subagent:** checks, PR review legwork, merges, commits, screenshots. The user reminded me about this on 2026-11-23.
- **A subagent merges only after its report is read.** A Haiku merge without a report was flagged as "merge without review": verify-only agents must never push.
- **Sonnet subagents write ALL frontend**, from the kit (`src/components/ui/` + README) and `design/style-preview.html`. The look is Klubi-inspired (cream/lime/lavender/maroon, soft 3D objects, loose hand-drawn stickers, [bracket] words); the user rejected flat thick-outline cartoon styles. References the user shows are for the idea only; always make it "our look".
- **agy workers do only non-UI work.**
  - Run them in separate git worktrees (`git worktree add ../shiftly-wN -b feat/x origin/main`), copying `.env` and `.agy/`, supervised by a Sonnet subagent that verifies, fixes with `agy -c`, commits and pushes the branch.
  - Command: `agy -p "Read .agy/briefs/<NAME>.md and do the task exactly." --model gemini-3.8-flash-high --mode accept-edits --settings ".agy/worker-settings.json" --print-timeout 900s`. Escalate to `claude-sonnet-4-6`.
  - Briefs live in `.agy/briefs/` (gitignored).
- **Max 2 heavy agents at once.** Never build while a dev server runs. Dev servers use their own port and are always stopped (kill the leftover node process on the port if TaskStop doesn't).
- **Every change:**
  - typecheck, lint, test, build;
  - hex/rgb only in `src/styles/` + `src/assets/`;
  - no `next/navigation`/server/data imports in `src/features/`;
  - secret-scan the diff;
  - `git commit -F`; push; confirm the Vercel status is success.
- **Cost stays ₹0:** free AI models, Gmail SMTP (not Resend: it needs an owned domain). Never print `.env`. Secrets go via the Vercel dashboard or the user's own terminal, never `!` commands with values.

## Accounts and services
- Demo logins (password `demo1234`): employee `aarohi@shiftly.demo`, admin `admin@shiftly.demo` (don't share the admin login publicly).
- Neon `shiftly` (`lively-water-45253969`).
- Groq free plan, OpenRouter free backup.
- Gmail sender: `GMAIL_USER` / `GMAIL_APP_PASSWORD` in local `.env` and Vercel production.
- The Vercel CLI is logged in and the folder is linked (`.vercel/`, `.env.local` are gitignored).
- Vercel env (names): DATABASE_URL, DIRECT_URL, AUTH_SECRET, GROQ_*, OPENROUTER_API_KEY, AI_BASE_URL, AI_CUSTOMER_MODEL, AI_JUDGE_MODEL, AI_MODE=real, NEXT_PUBLIC_INTRO_ALWAYS=1, GMAIL_USER, GMAIL_APP_PASSWORD, DATA_SOURCE (to be set to `real`).

## Open questions for the user
- Are the buddy names (Sunny, Ace, Bowie, Cappy, Nerdy, Royal) and the intro headlines confirmed?
- Show the demo-login helper on the live site? (Currently local only.)
- The new "covers eyes" and "thumbs-up" buddy poses need the user's approval.
