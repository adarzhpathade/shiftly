# Project Overview

**Interactive Customer & Employee Training and Habit Development Platform**
College minor project. Status: **planning** (nothing built yet).
Working style: discuss → finalise this overview → design prototypes → build step by step.

---

## 1. Problem

Most workplace training is lectures, documents and theory. Employees get little chance to practise real customer situations, and nothing helps them build consistent professional habits after the training ends.

## 2. Solution

A **gamified, mobile-first Progressive Web App (PWA)** that combines two things in one place:

1. **Scenario training:** practise real customer-service situations, choose a response and get instant feedback and a score.
2. **Habit building:** set daily or weekly professional habits, check in, and keep streaks going.

Both feed one **gamification layer** (XP, levels, streaks, badges, leaderboard), so learning and habits reward each other.

## 3. Objectives

1. Let users practise realistic customer-service scenarios with immediate, explained feedback.
2. Help users build and keep positive workplace habits through daily check-ins and streaks.
3. Keep users motivated with game mechanics (XP, levels, badges, quests, leaderboard).
4. Give managers clear analytics on team progress and weak areas.
5. Work smoothly on phones (installable PWA) and on desktop.

---

## 4. User Roles

| Role | What they do | Main device |
|---|---|---|
| **Employee** | Plays scenarios, tracks habits, earns XP and badges, views own progress and leaderboard | Phone (app-like UI) |
| **Manager / Trainer** | Assigns training to their team, views team analytics, sees who is falling behind | Desktop (usable on phone) |
| **Admin** | Manages users, teams, scenarios, categories, badges and habit templates | Desktop |

---

## 5. Modules and Features

### 5.1 Authentication and Profile
- Register, log in and log out. Role-based access (Employee / Manager / Admin).
- Profile: name, avatar (pick from illustrated avatars), team, level, total XP, badges.

### App Modes
The app has only **two modes**, matching the two halves of the project. The game layer (5.4) rewards both.

| Mode | Purpose |
|---|---|
| **Training Mode** | Learn customer service by playing scenarios (5.2) |
| **Habit Mode** | Build professional habits through daily check-ins (5.3) |

Rejected extra modes (Rush, Team Battle, separate Practice, AI Roleplay) to keep the scope focused. AI feedback stays an optional extra (5.8).

### 5.2 Training Mode (core)
- Scenarios grouped into **4 categories**, each with its own colour and hero object:

| Category | Teaches | Example scenarios | Colour |
|---|---|---|---|
| **Handling Complaints** | Listening, apologising, owning the problem | Late delivery, wrong order, overcharged bill | Coral |
| **Customer Queries** | Clear, accurate, helpful answers | Product question, refund policy, order status | Sky blue |
| **Difficult Customers** | Staying calm, de-escalating, setting boundaries | Angry customer, rude remarks, bad-review threat | Berry |
| **Problem Solving** | Root cause, options, follow-through | Repeated issue, request outside policy, system outage | Teal |

- Professional communication (tone, empathy, etiquette) is not a separate category. It is commented on in the feedback of every scenario.
- **5 levels per category**, shown as a **level path** like a game map. Earning stars unlocks the next level:
  - **Levels 1–4 (Guided):** 2 Beginner + 2 Intermediate multiple-choice scenarios (16 total).
  - **Level 5 (BOSS): Live call** with an AI customer (4 boss personas, one per category).
- **Guided scenario:** a short situation (customer "chat bubble" style) and **3–4 response choices**. Each choice is rated **Best / Okay / Poor**, gives points and explains *why*. Intermediate scenarios can be **multi-step** (2–3 steps).
- **Boss level (AI roleplay):** see 5.2a.
- Result screen: score, stars (1–3), XP earned and the feedback for each step.
- **Mastery ring** per category fills as stars are earned.
- Any scenario can be replayed to improve the score (no separate practice mode).
- **Today's Challenge:** one highlighted scenario per day for bonus XP.

### 5.2a Boss Level: Live Call with an AI Customer
The last level of every category is a free-text chat with an AI customer who behaves like a real person. Powered by **OpenRouter**: the customer is **Baidu ERNIE 5.5 Flash** (`baidu/ernie-5.5-flash-preview:free`) and the judge is **Perplexity Decider Flash V1.3** (`perplexity/pplx-decider-flash-v1.3:free`), a decision model that returns typed rubric scores instead of text. Models are set in `.env`, so they can be swapped without code changes.

- **Two AI roles:**
  1. **Customer:** a persona with a name, problem, starting mood and hidden goal (e.g. "Mr. Sharma, third call about a refund, angry, calms down only if someone takes ownership"). Stays in character; replies stream word by word.
  2. **Judge:** silently scores every user reply on **empathy, ownership, clarity, solution and tone** and returns structured JSON.
- **Mood meter (boss health bar):** moves 😡 → 😐 → 🙂 with each reply.
- **Win:** customer calm and problem resolved. **Lose:** mood hits rock bottom. Maximum ~8 turns.
- **Result:** stars, XP, score per skill, and "A better reply would be…" for the weakest reply.
- **Input:** typing with quick-reply chips; voice input (Web Speech API) optional.
- **Limits and safety:** API key server-side only; ~10 boss attempts per user per day; reply length cap; off-topic or abusive input ends the call politely.
- **Fallback:** if the AI API fails, the boss switches to a multiple-choice version of the same scenario.
- Conversations are saved so managers can review them.

### 5.3 Habit Mode (core)
- Create habits from **templates** (Punctuality, Effective Communication, Task Completion, Teamwork, Customer Follow-up, Daily Learning) or a custom habit.
- Frequency: daily or specific days of the week.
- One-tap **daily check-in**.
- **Streaks** (current and best), a calendar heatmap and completion rate.
- Optional short reflection note on check-in.

### 5.4 Gamification Layer
| Mechanic | How it works |
|---|---|
| **XP** | Earned from scenarios (by score) and habit check-ins |
| **Levels** | XP thresholds (Level 1 → 2 → 3 …) with a level-up celebration screen |
| **Streak flame** | Daily activity streak, shown on the home screen |
| **Badges** | E.g. "First Steps", "7-Day Streak", "Complaint Crusher", "Perfect Score", "Team Player" |
| **Daily quests** | 3 small goals per day (e.g. "Finish 1 scenario", "Check in 3 habits") for bonus XP |
| **Leaderboard** | Weekly XP ranking within the team and company-wide |
| **Celebrations** | Big-moment screens with giant type and animated hero objects (level up, new badge, streak milestone) |

### 5.5 Dashboard and Analytics
- **Employee home:** streak, today's quests, today's habits, "continue training" card, XP progress to next level.
- **Progress page:** charts for scores over time, category mastery, habit completion and weak areas.
- **Manager dashboard:** team overview, average scores per category, habit consistency, inactive members, assignment completion.

### 5.6 Manager / Admin Panel
- Manage users and teams (manager can see own team only).
- Create and edit scenarios (steps, choices, scores, feedback), categories and difficulty.
- Manage badges and habit templates.
- Assign scenarios to a team with a due date.

### 5.7 PWA Features
- Installable on the phone home screen with its own icon and splash screen.
- **Push notifications:** habit reminders, streak-at-risk alerts, new assignments.
- Offline basics: app shell and today's habits load without internet. Check-ins sync when back online.

### 5.8 Optional / Future (only if time allows)
- Voice input for the boss level (speech to text).
- Personalised recommendations ("You score low in Difficult Customers, try these").
- Dark mode.
- Export reports (PDF/CSV) for managers.

---

## 6. Feature Priority

| Tier | Features |
|---|---|
| **Must have** | Auth and roles, guided scenarios with feedback and scoring, **AI boss level**, habit check-ins with streaks, XP and levels, employee home dashboard, PWA install |
| **Should have** | Badges, daily quests, leaderboard, progress charts, admin scenario editor, manager team dashboard, push reminders |
| **Nice to have** | Voice input, offline check-in sync, recommendations, dark mode, report export |

---

## 7. Visual Design Direction

Direction: **playful brand identity, inspired by Klubi** (reference: `C:\Users\adarz\Downloads\Playful Brand Identity.jpg`). Replaces the earlier flat, thick-outline style borrowed from the Delivery app. Live preview: `design/style-preview.html`.

| Element | Rule |
|---|---|
| **Font** | Bricolage Grotesque for everything, weight 800 for headlines, tight letter spacing, maroon colour |
| **Bracket words** | One word in a headline in **[brackets]** and lavender: "Calm the [angry] caller", "Small habits, [big wins]" |
| **3D objects** | Soft clay/matte 3D renders, floating and tilted, with soft shadows. Made with AI in one consistent style (prompts in `design/ai-render-prompts.md`) |
| **Sticker buddy** | Loose hand-drawn line character with a simple happy face and a white sticker edge. Poses: wave, headset, cheer. Used only at key moments: Today's Challenge, best answers, celebrations, empty states |
| **Photos** | Real stock photos (Unsplash / Pexels) on challenge cards and customer avatars |
| **Cards** | Solid colour blocks, 18–26px radius, no outlines. Headline text inside cards like a poster |
| **Navigation** | Floating maroon pill tab bar; active tab is a lime circle |
| **Big-moment screens** | Full colour block, giant word (e.g. "LEVEL [5]"), floating 3D objects and the cheering sticker |
| **Motion** | Gentle floating of 3D objects, spring pop-ins, XP counters roll up |
| **Spacing** | 4px grid, 16px side gutter, 48px minimum tap target |

**Palette:**

| Token | Colour | Use |
|---|---|---|
| cream | `#F2ECE3` | Screen background |
| paper | `#FBF7F0` | Cards, sheets, chat bubbles |
| ink | `#3B0D12` maroon | Text, buttons, tab bar |
| lime | `#D4DE3A` | Highlights, active tab, best answer, CTA chips |
| lavender | `#BDB2F5` | Blocks, celebration background; `#7A68E0` for bracket words on cream |
| red | `#E0352B` | Small pops (ribbons, headset), poor answer |
| sky | `#A9C7EC` | Category block |
| peach | `#F7C9A8` | Category block |
| xp-gold | `#F5B83D` | Coins, trophies (in 3D renders) |

**Category colours and objects:**

| Category | Block colour | 3D object |
|---|---|---|
| Handling Complaints | Peach `#F7C9A8` | Coral megaphone |
| Customer Queries | Sky `#A9C7EC` | Blue speech bubble with "?" |
| Difficult Customers | Lavender `#BDB2F5` | Storm cloud with gold bolt |
| Problem Solving | Lime `#D4DE3A` | Lavender puzzle piece |

Best / Okay / Poor feedback always shows a label and icon as well as colour.

---

## 8. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One codebase for frontend and backend (API routes / server actions) |
| Styling | **Tailwind CSS** with the design tokens above | Fast and consistent; the tokens map 1:1 |
| Animation | **Motion (Framer Motion)** + inline SVG | Spring animations for hero objects and celebrations |
| Charts | **Recharts** | Progress and analytics charts |
| Database | **PostgreSQL (Neon)** | Free tier, cloud hosted |
| ORM | **Prisma** | Simple schema, migrations and seed data |
| Auth | **Auth.js (NextAuth)** with email and password | Role-based sessions |
| PWA | Web app manifest + service worker (**Serwist**) + Web Push | Install, offline shell, reminders |
| Hosting | **Vercel** | Free, auto-deploy, HTTPS (needed for PWA and push) |
| AI | **OpenRouter**: ERNIE 5.5 Flash (customer), Perplexity Decider Flash V1.3 (judge) | One key, free models, swappable through `.env` |

---

## 9. Database Design (first draft)

| Table | Key fields |
|---|---|
| `User` | id, name, email, passwordHash, role, avatar, teamId, xp, level, currentStreak, bestStreak, lastActiveDate |
| `Team` | id, name, managerId |
| `Category` | id, name, colour, icon, description |
| `Scenario` | id, categoryId, title, situation, difficulty, xpReward, isPublished |
| `ScenarioStep` | id, scenarioId, order, customerMessage |
| `Choice` | id, stepId, text, rating (BEST/OKAY/POOR), points, feedback, nextStepId |
| `Attempt` | id, userId, scenarioId, score, stars, xpEarned, completedAt |
| `AttemptAnswer` | id, attemptId, stepId, choiceId |
| `Habit` | id, userId, title, icon, frequency, daysOfWeek, reminderTime, isActive |
| `HabitLog` | id, habitId, date, note |
| `Badge` | id, name, description, icon, ruleType, ruleValue |
| `UserBadge` | id, userId, badgeId, earnedAt |
| `DailyQuest` | id, userId, date, type, target, progress, completed |
| `Assignment` | id, teamId, scenarioId, dueDate, assignedBy |
| `XpEvent` | id, userId, source, amount, createdAt (used for the weekly leaderboard) |
| `BossPersona` | id, categoryId, name, problem, startMood, hiddenGoal, systemPrompt |
| `RoleplaySession` | id, userId, personaId, status (ACTIVE/WON/LOST/FALLBACK), finalMood, stars, xpEarned, startedAt, endedAt |
| `RoleplayTurn` | id, sessionId, order, userMessage, customerReply, moodAfter, scores (empathy, ownership, clarity, solution, tone), feedback |

---

## 10. Main Screens

### Employee PWA (mobile-first): 15 pages + 4 overlays

**Bottom tab bar:** Home · Training · Habits · Leaderboard · Profile

| # | Page | Content |
|---|---|---|
| | **First-time flow** | |
| 1 | Splash | Logo with a hero object dropping in |
| 2 | Intro story | 3 scenes, giant word + one object: *LEARN* (headset), *BUILD* (streak flame), *LEVEL UP* (trophy) |
| 3 | Login / Register | Email and password |
| 4 | Setup | Pick an avatar, choose 2–3 starter habits |
| | **Home tab** | |
| 5 | Home | Greeting, streak flame, XP bar, Today's Challenge, today's habits (quick check-in), 3 daily quests, continue training |
| | **Training tab** | |
| 6 | Categories | 4 coloured category cards with mastery rings |
| 7 | Level path | Game-map path of a category's 5 scenarios, with stars and locks |
| 8 | Scenario player | Guided: customer chat bubble, 3–4 choice cards, feedback after each answer. Boss: live chat with the AI customer, mood meter, quick-reply chips |
| 9 | Result | Score, 1–3 stars, XP count-up, feedback for each step; Replay / Next |
| | **Habits tab** | |
| 10 | My habits | Today's habits, one-tap check-in, streak on each |
| 11 | Add / edit habit | Template or custom: name, icon, days, reminder time |
| 12 | Habit detail | Current and best streak, calendar heatmap, completion %, notes |
| | **Leaderboard tab** | |
| 13 | Leaderboard | Weekly XP ranking, Team / Company toggle, top-3 podium |
| | **Profile tab** | |
| 14 | Profile | Avatar, level, XP; **badge shelf** (earned in colour, locked in grey); **progress charts** (scores over time, category mastery, habit completion, weak areas) |
| 15 | Settings | Notifications, reminder times, install-app button, logout |

**Celebration overlays (appear anywhere):** LEVEL UP (rocket) · NEW BADGE (medal) · STREAK! (flame, at 7/30/100 days) · PERFECT (trophy, 3 stars)

**System pages:** Offline, 404 (not counted above)

### Manager / Admin panel (desktop-first)
1. Team dashboard
2. Member detail
3. Scenario editor
4. Users and teams
5. Badges and habit templates
6. Assignments

---

## 11. Development Plan

| Phase | Work | Output |
|---|---|---|
| 1 | Finalise this overview | Approved scope |
| 2 | **Design prototypes** in HTML (like the Delivery `design/` folder): tokens, hero-object SVGs, key mobile screens | Clickable prototype and final palette |
| 3 | Project setup: Next.js, Tailwind tokens, Prisma + Neon, auth, PWA shell | Running skeleton, deployed |
| 4 | Training Mode: 16 guided scenarios + 4 AI boss personas | Playable training |
| 5 | Habit module: check-ins, streaks, heatmap | Working habits |
| 6 | Gamification: XP, levels, badges, quests, leaderboard, celebrations | Game layer |
| 7 | Dashboards and charts (employee + manager) | Analytics |
| 8 | Admin panel: scenario editor, users, teams, assignments | Content management |
| 9 | PWA polish: push reminders, offline, install prompt | Installable app |
| 10 | Testing, bug fixes, demo data, final deploy | Final build |
| 11 | Documentation: report, diagrams (ER, DFD, use case), PPT | College submission |

---

## 12. Expected Outcomes
- A working, deployed, installable app that can be demoed live on a phone.
- Seeded demo data: sample company, teams, users and about 20 scenarios.
- Report, diagrams and presentation for submission.

## 13. Open Questions
1. **App name.** Ideas: *Habitrain*, *SkillStreak*, *Shiftly*, *LevelUp Desk*, *ServeQuest*.
2. **Palette.** Confirm the violet + gold + flame proposal, or reuse Mocha & Amber from the Delivery app.
3. Team size and deadline (assumed about 8 weeks; adjust the plan if different).
4. Any college requirement for the report format or specific diagrams.

## 14. Decisions Log
| Date | Decision |
|---|---|
| 2026-11-22 | Mobile-first **PWA**; manager/admin panel desktop-first |
| 2026-11-22 | Three roles: Employee, Manager/Trainer, Admin |
| 2026-11-22 | Must / Should / Nice-to-have tiers accepted |
| 2026-11-22 | Scenarios: multiple choice with explained feedback; some multi-step |
| 2026-11-22 | Gamified visual style reused from the Delivery customer app (Bricolage Grotesque, thick-outline hero objects, giant words for big moments, spring motion) |
| 2026-11-22 | Stack: Next.js + Tailwind + Prisma + Neon Postgres + Auth.js, hosted on Vercel |
| 2026-11-22 | Only two modes: **Training Mode** and **Habit Mode**; game layer rewards both |
| 2026-11-22 | 4 training categories, each with its own colour: Handling Complaints (coral), Customer Queries (sky blue), Difficult Customers (berry), Problem Solving (teal). Professional Communication folded into every scenario's feedback |
| 2026-11-22 | 20 scenarios: 5 per category (2 Beginner, 2 Intermediate, 1 Advanced multi-step) |
| 2026-11-22 | Employee PWA: 15 pages + 4 celebration overlays, 5 bottom tabs. Progress and Badges merged into Profile |
| 2026-11-22 | Leaderboard is company-only: Team (default) and Company views, weekly XP reset plus All time |
| 2026-11-22 | **AI boss level:** level 5 of every category is a live chat with an AI customer (originally NVIDIA Nemotron) plus an AI judge and mood meter. Boss level only, no separate roleplay mode. Content becomes 16 guided scenarios + 4 boss personas |
| 2026-11-22 | AI provider changed to **OpenRouter**: ERNIE 5.5 Flash Preview as the customer, Perplexity Decider Flash V1.3 as the judge (free models; config in `.env`) |
| 2026-11-22 | Workers run commands themselves (Option B), with git checkpoints and diff review |
| 2026-11-22 | **Visual style changed** to Klubi-inspired playful identity: cream / lime / lavender / maroon, soft 3D objects (AI renders), real photos, loose sticker character. Flat thick-outline Delivery style dropped |
