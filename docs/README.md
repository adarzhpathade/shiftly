# Minor Project Documentation

Everything the college submission needs, where its content comes from, and its status. Filled in **as we build**, so nothing has to be reconstructed at the end.

**Project:** shiftly (placeholder name): Interactive Customer & Employee Training and Habit Development Platform
**Team:** Adarsh Pathade + Friend (name to be added)

---

## 1. Submission checklist

| # | Document | Status | Source |
|---|---|---|---|
| 1 | **Synopsis** (2–4 pages: problem, objectives, scope, modules, tech stack, timeline) | todo | `PROJECT_OVERVIEW.md` sections 1–8, 11 |
| 2 | **SRS** (Software Requirements Specification) | todo | Overview sections 4–6, 9; `BUILD_PLAN.md` |
| 3 | **Project report** (chapters in section 2 below) | todo | All docs + screenshots |
| 4 | **Diagrams** (list in section 3) | todo | `docs/diagrams/` |
| 5 | **Screenshots** of every screen (mobile + desktop) | todo | `docs/screenshots/` (captured by the watcher) |
| 6 | **Test cases and results** | todo | `docs/testing.md` |
| 7 | **User manual** (how to install the PWA and use each feature) | todo | `docs/user-manual.md` |
| 8 | **Presentation (PPT)** | todo | Built from the report |
| 9 | **Viva preparation** (likely questions and answers) | todo | `docs/viva-notes.md` |
| 10 | **Source code + live link + README** | todo | GitHub repo, Vercel URL |
| 11 | **Contribution statement** (who did what) | todo | `BUILD_PLAN.md` owner column + GitHub history |

---

## 2. Report chapter outline

| Chapter | Contents |
|---|---|
| Certificate, Declaration, Acknowledgement | College format |
| Abstract | 250–300 words (the project description, updated with the final features) |
| Table of contents, list of figures, list of tables | Generated at the end |
| **1. Introduction** | Background, problem statement, motivation, objectives, scope |
| **2. Literature Review / Existing Systems** | Traditional training (lectures, documents), e-learning (LMS), habit apps (Habitica, Duolingo-style streaks), AI roleplay training; gaps our system fills |
| **3. System Analysis** | Existing vs proposed system, feasibility study (technical, economic, operational), requirements (functional and non-functional), hardware and software requirements |
| **4. System Design** | Architecture, modules, diagrams (section 3), database design (tables and relationships), UI design (style guide, screens) |
| **5. Implementation** | Tech stack and why, folder structure, key modules: guided scenarios, **AI boss level** (customer + judge prompts, mood meter), habits and streak logic, gamification (XP, levels, badges, quests), leaderboard, PWA (service worker, push), auth and roles; important code snippets |
| **6. Testing** | Testing approach (unit, integration, end-to-end, device testing), test cases table with expected vs actual results |
| **7. Results** | Screenshots of each screen with short descriptions, performance (Lighthouse), demo flow |
| **8. Conclusion and Future Scope** | What was achieved; future: voice calls, personalised recommendations, multi-company support, more languages, analytics exports |
| References | Docs, papers, libraries (IEEE or college format) |
| Appendix | User manual, sample scenarios, AI prompts |

---

## 3. Diagrams needed

| Diagram | Shows | Status |
|---|---|---|
| System architecture | PWA ↔ Next.js server ↔ Postgres (Neon) ↔ NVIDIA AI API; service worker and push | todo |
| Use case diagram | Employee, Manager, Admin and their actions | todo |
| ER diagram | All tables from overview section 9 and their relationships | todo |
| DFD level 0 (context) | System and external entities | todo |
| DFD level 1 | Auth, Training, Boss AI, Habits, Gamification, Leaderboard, Admin processes | todo |
| Activity / flow: guided scenario | Start → answer → feedback → score → XP | todo |
| Activity / flow: boss level | Start call → user reply → judge → mood → win / lose / fallback | todo |
| Activity / flow: habit check-in | Check in → streak update → XP → badge check | todo |
| Sequence diagram: boss level turn | User → app → API → Nemotron (customer + judge) → DB → app | todo |
| Class / module diagram (optional) | Main services and repositories | todo |
| Gantt chart | Timeline of the development plan | todo |

Diagrams will be written as **Mermaid** files in `docs/diagrams/` (they render on GitHub and can be exported as images for the report).

---

## 4. Build log (for the report)
Short entries added after each completed step: what was built, decisions, problems faced and how they were solved. The "Problems faced" part becomes report material and viva answers.

| Date | Step | What was done | Problems and solutions |
|---|---|---|---|
| 2026-11-22 | Planning | Scope, modes, categories, pages, visual style, AI boss level, build plan | Visual style changed from flat outline to Klubi-inspired 3D after the first preview |
| 2026-11-22 | Step 0 | Tool checks, agy worker tests, git init | agy auto mode not available on the account; headless command rules only match exact commands; chose workers-run-commands with git checkpoints and diff review |
| 2026-11-22 | Step 1 | Next.js 16 scaffold (F1), shared data contract and mocks (F2), Prisma schema + Neon migration + demo seed (F3, agy worker), Auth.js login and roles (F4, agy worker), UI kit and dev gallery (F5), PWA shell (F6). Public GitHub repo; first Vercel deploy (Singapore region) with a verified live login | (1) Parallel agents could clash on the package lockfile → shared packages pre-installed and a lock file used for installs. (2) Review found the auth proxy let any path with a file extension skip login (e.g. `/admin/x.js`) → rule limited to root files and asset folders, verified by HTTP checks. (3) First Vercel build failed: Prisma config needs `DIRECT_URL` at install time → added to Vercel env. (4) Free AI limits: OpenRouter free = 50 requests/day, too low → Groq free plan (1,000/day, verified) as main provider, OpenRouter as backup |
