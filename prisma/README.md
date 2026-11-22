# Prisma Database Documentation for Shiftly

This directory houses the database schema, migration history, seed scripts, and documentation for Shiftly's PostgreSQL database hosted on Neon.

---

## 1. Schema Models Overview (Grouped)

### Core & Organisation
* **`User`**: Application users with authentication credentials (`passwordHash`), roles (`ADMIN`, `MANAGER`, `EMPLOYEE`), gamification progression (`xp`, `level`, streak counts), active team membership, and avatar keys.
* **`Team`**: Organizational units with an assigned manager (`managerId` referencing `User`) and members.
* **`Category`**: Training modules (`Handling Complaints`, `Customer Queries`, `Difficult Customers`, `Problem Solving`) with design color tokens and 3D object asset identifiers.

### Scenario Training Mode
* **`Scenario`**: Guided practice scenarios assigned to categories with difficulty levels (1–4: Beginner / Intermediate / Advanced) and XP rewards.
* **`ScenarioStep`**: Dialogue exchanges containing customer messages.
* **`Choice`**: Response choices evaluated with ratings (`BEST`, `OKAY`, `POOR`), point values, tailored coaching feedback, and optional branch pointers (`nextStepId`).
* **`Attempt`**: User completion attempts recording overall score, star rating (1–3), XP earned, and timestamp.
* **`AttemptAnswer`**: Detailed audit trail mapping each scenario step to the user's selected choice.

### AI Boss Level (Live Call Roleplay)
* **`BossPersona`**: Category-specific AI customer personas with personality prompts, starting mood, and hidden goals.
* **`RoleplaySession`**: Live roleplay sessions tracking real-time customer mood, session status (`ACTIVE`, `WON`, `LOST`, `FALLBACK`), and completion rewards.
* **`RoleplayTurn`**: Turn-by-turn dialogue logs capturing user messages, AI replies, resulting mood, and rubric scores (0–10 on empathy, ownership, clarity, solution, tone).

### Habit Building Mode
* **`Habit`**: Individual professional habits with custom or template origins, tracking frequency (`DAILY`, `WEEKLY`), target days, and optional reminders.
* **`HabitLog`**: Daily habit check-in logs with optional reflection notes (`@@unique([habitId, date])`).
* **`HabitTemplate`**: Pre-defined workplace habit blueprints (e.g. Punctuality, Effective Communication).

### Gamification & Engagement
* **`Badge`**: Achievement badges with criteria rules (`ruleType`, `ruleValue`) and illustrated asset keys.
* **`UserBadge`**: Earned badges per user with achievement timestamps (`@@unique([userId, badgeId])`).
* **`DailyQuest`**: Dynamic daily goals tracking progress toward daily targets (`@@index([userId, date])`).
* **`Assignment`**: Manager-assigned scenarios targeted to specific teams with due dates.
* **`XpEvent`**: Granular XP audit events powering weekly and all-time leaderboards (`@@index([userId, createdAt])`).
* **`PushSubscription`**: Web push notification subscription endpoints for streak alerts and habit reminders.

---

## 2. Setup & Configuration

Shiftly uses **Prisma ORM 7** with Neon Serverless PostgreSQL and driver adapters.

* **Migrations & CLI**: Driven by `prisma.config.ts` using the direct unpooled connection string (`DIRECT_URL`).
* **App Runtime & Seed**: Uses `@prisma/adapter-neon` via the pooled connection string (`DATABASE_URL`).
* **Client Output**: Generated into `src/generated/prisma`.

### Available Scripts

```bash
# Generate Prisma Client
pnpm db:generate

# Apply migrations in development
pnpm db:migrate

# Seed demo data
pnpm db:seed

# Open Prisma Studio web inspector
pnpm db:studio
```

---

## 3. How to Plug in Scenarios Seed

Friend / content team members can supply real scenario content by creating `prisma/seed/scenarios/index.ts`.

The main seed script dynamically detects and imports this file if present:

```typescript
// prisma/seed/scenarios/index.ts
import { PrismaClient } from "../../src/generated/prisma/client";

export async function seedScenarios(prisma: PrismaClient): Promise<void> {
  // 1. Look up existing categories (handling-complaints, customer-queries, difficult-customers, problem-solving)
  // 2. Upsert scenarios, steps, choices, and boss personas using deterministic IDs
}
```

See [prisma/seed/scenarios/README.md](./seed/scenarios/README.md) for full instructions.

---

## 4. Demo Login Credentials

All demo accounts share the password: `demo1234` (hashed with bcrypt cost 10).

| Role | Name | Email | Team | XP | Level | Streak |
|---|---|---|---|---|---|---|
| **Admin** | Aditya Rao | `admin@shiftly.demo` | — | 1200 | 7 | 5 |
| **Manager** | Aarav Sharma | `manager.a@shiftly.demo` | Support Team A | 1800 | 10 | 8 |
| **Manager** | Priya Patel | `manager.b@shiftly.demo` | Support Team B | 1650 | 9 | 6 |
| **Manager** | Rohan Gupta | `manager.retail@shiftly.demo` | Retail Desk | 2100 | 11 | 12 |
| **Manager** | Neha Verma | `manager.escalations@shiftly.demo` | Escalations | 2350 | 12 | 15 |
| **Employee** | Aarohi Joshi | `aarohi@shiftly.demo` | Support Team A | 850 | 5 | 4 |
| **Employee** | Vikram Singh | `vikram@shiftly.demo` | Support Team A | 1420 | 8 | 7 |
| **Employee** | Siddharth Malhotra | `siddharth@shiftly.demo` | Support Team B | 620 | 4 | 3 |
| **Employee** | Diya Mehra | `diya@shiftly.demo` | Support Team B | 1240 | 7 | 6 |
| **Employee** | Rahul Saxena | `rahul@shiftly.demo` | Retail Desk | 2380 | 12 | 16 |
| **Employee** | Sneha Bhatt | `sneha@shiftly.demo` | Escalations | 1150 | 6 | 5 |
| **Employee** | Dev Mukherjee | `dev@shiftly.demo` | Escalations | 80 | 1 | 1 |
