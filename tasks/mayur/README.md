# Your tasks on shiftly (Mayur)

Hi! You own two backend tasks. You run them with the `agy` (Antigravity) CLI on your laptop, check the result, and push from your own GitHub account through a pull request.

| Order | Brief | Task | Your folders |
|---|---|---|---|
| 1 | `01-progress-gamification.md` | **M1**: shared XP/quest/badge engine + Gamification backend (profile, badges, quests) | `src/server/progress/`, `src/server/gamification/` |
| 2 | `02-training-home.md` | **M2**: Training backend (attempts, stars, XP, unlocks) + Home | `src/server/training/`, `src/server/home/` |

**Do M1 first and open its PR quickly**: Khushi's habits task needs your helpers.

Khushi works at the same time on `src/server/habits/` and `src/server/leaderboard/`. Don't touch those folders; she won't touch yours. You both edit one line each in `src/data/index.ts`; if git shows a conflict there, keep both lines.

Read `PROJECT_OVERVIEW.md` first (10 minutes), then `BUILD_PLAN.md` "Rules".

## One-time setup
1. Accept the GitHub invite (email or github.com/notifications).
2. Install **Node 24+**, **pnpm** (`npm i -g pnpm`), **git**, **agy** (log in when it asks).
3. `git clone https://github.com/adarzhpathade/shiftly.git`, `cd shiftly`, `pnpm install`
4. **`.env`**: Adarsh sends it privately. Put it in the project root. **Never commit or paste it anywhere**: the repo is public and it holds the database password. Set `DATA_SOURCE=real` in it when you test your work.
5. Check: `pnpm typecheck`, `pnpm test`, `pnpm dev` (open http://localhost:3000, log in with `aarohi@shiftly.demo` / `demo1234`).
6. Create `.agy/worker-settings.json` (the folder is git-ignored):
   ```json
   {"permissions":{"allow":["command(*)"]}}
   ```

## For each task
```
git checkout main
git pull
git checkout -b feat/progress-gamification      # M2: feat/training-api

agy -p "Read tasks/mayur/01-progress-gamification.md and do the task exactly." --model gemini-3.8-flash-high --mode accept-edits --settings ".agy/worker-settings.json" --print-timeout 900s
```
Fix round (same conversation):
```
agy -c -p "The test X fails with: <paste error>. Fix it." --model gemini-3.8-flash-high --mode accept-edits --settings ".agy/worker-settings.json" --print-timeout 900s
```
Stuck twice on the same problem → use `--model claude-sonnet-4-6`.

**Then check it yourself** (you explain this in the viva):
1. `git status`: only files your brief allows changed.
2. Read the code; understand the main logic (how XP, quests and badges are given).
3. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`: all pass.
4. Try it in the app as the brief says.

**Commit and push:**
```
git add -A
git commit -m "M1: progress engine and gamification backend"
git push -u origin feat/progress-gamification
```
Open the pull request on GitHub. Adarsh reviews and merges. Fix requested changes on the same branch and push again.

## Rules
- Never commit `.env` or paste its values. Never `git push --force` or push to `main`.
- Only touch the files your brief allows. Ask Adarsh first if something else seems needed.
- Ask anything in the group chat.
