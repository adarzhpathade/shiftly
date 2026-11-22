# Your tasks on shiftly

Hi! You own three backend tasks. You run them with the `agy` CLI on your laptop, check the result, and push them from your own GitHub account through a pull request.

| Order | Brief | Task | Your folders |
|---|---|---|---|
| 1 | `01-habits.md` | **B3 Habits backend**: create / edit / delete habits, check-in, streaks | `src/server/habits/` |
| 2 | `02-leaderboard.md` | **B4 Leaderboard backend**: weekly / all-time XP, Team / Company | `src/server/leaderboard/` |
| 3 | `03-scenarios.md` | **B5 Scenario content**: 16 guided scenarios + 4 AI boss customers | `prisma/seed/scenarios/`, `docs/scenarios.md` |

Read `PROJECT_OVERVIEW.md` first (10 minutes): it explains the whole app. Then `BUILD_PLAN.md` "Rules".

---

## One-time setup

1. **Accept the GitHub invite** (email from GitHub, or github.com/notifications).
2. Install: **Node 24+** (nodejs.org), **pnpm** (`npm i -g pnpm`), **git**, and **agy** (the Antigravity CLI; log in when it asks).
3. Clone and install:
   ```
   git clone https://github.com/adarzhpathade/shiftly.git
   cd shiftly
   pnpm install
   ```
4. **`.env`**: Adarsh sends you the file privately (WhatsApp / DM). Put it in the project root. **Never commit it or paste it anywhere public**: the repo is public and this file holds the database password.
5. Check everything works:
   ```
   pnpm typecheck
   pnpm test
   pnpm dev        # open http://localhost:3000, log in with an account from prisma/README.md
   ```
6. Create the agy worker settings file (agy's headless mode needs it to run commands). Make a folder `.agy` in the project root and a file `.agy/worker-settings.json` containing:
   ```json
   {"permissions":{"allow":["command(*)"]}}
   ```
   (`.agy/` is git-ignored.)

## For each task

```
git checkout main
git pull
git checkout -b feat/habits-api            # one branch per task: feat/habits-api, feat/leaderboard-api, feat/scenario-content

agy -p "Read tasks/friend/01-habits.md and do the task exactly." --model gemini-3.8-flash-high --mode accept-edits --settings ".agy/worker-settings.json" --print-timeout 900s
```

If the worker stops with problems, continue the same conversation with a fix instruction:
```
agy -c -p "The test X fails with: <paste error>. Fix it." --model gemini-3.8-flash-high --mode accept-edits --settings ".agy/worker-settings.json" --print-timeout 900s
```
If Flash gets stuck twice on the same problem, switch to `--model claude-sonnet-4-6`.

**Then check it yourself** (this is the important part, and what you explain in the viva):
1. `git status`: only files in your task's folders (plus the ones the brief allows) changed.
2. Read the code it wrote. Make sure you understand the main logic (e.g. how a streak is calculated).
3. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. All must pass.
4. Try it in the app (`pnpm dev`) where the brief says how.

**Then commit and push from your account:**
```
git add -A
git commit -m "B3: habits backend with check-ins and streaks"
git push -u origin feat/habits-api
```
Open the pull request on GitHub (it shows a "Compare & pull request" button). Adarsh's review runs the same checks and merges it. If changes are requested, fix them on the same branch and push again.

## Rules for you and your worker
- Never commit `.env` or paste its values anywhere.
- Never `git push --force` or push to `main` directly.
- Only touch the files your brief allows. If something outside them seems necessary, ask Adarsh first.
- Ask anything in the group chat; there are no silly questions.
