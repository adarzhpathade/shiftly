import "dotenv/config";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  Role,
  XpSource,
} from "../src/generated/prisma/client";
import { seedScenarios } from "./seed/scenarios/index";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required to run seed");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Shiftly database seed...");

  // 1. Categories
  const categoriesData = [
    {
      id: "cat-handling-complaints",
      slug: "handling-complaints",
      name: "Handling Complaints",
      colorToken: "peach",
      objectKey: "megaphone",
      description:
        "Master active listening, sincere apologies, and problem ownership to resolve customer grievances.",
      order: 1,
    },
    {
      id: "cat-customer-queries",
      slug: "customer-queries",
      name: "Customer Queries",
      colorToken: "sky",
      objectKey: "bubble",
      description:
        "Deliver clear, accurate, and prompt answers to common and complex customer inquiries.",
      order: 2,
    },
    {
      id: "cat-difficult-customers",
      slug: "difficult-customers",
      name: "Difficult Customers",
      colorToken: "lav",
      objectKey: "cloud",
      description:
        "Stay calm, de-escalate emotional tension, and enforce healthy boundaries with grace.",
      order: 3,
    },
    {
      id: "cat-problem-solving",
      slug: "problem-solving",
      name: "Problem Solving",
      colorToken: "lime",
      objectKey: "puzzle",
      description:
        "Investigate root causes, formulate viable action plans, and ensure comprehensive follow-through.",
      order: 4,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        colorToken: cat.colorToken,
        objectKey: cat.objectKey,
        description: cat.description,
        order: cat.order,
      },
      create: cat,
    });
  }

  // 1b. Seed 16 guided scenarios and 4 boss personas
  await seedScenarios(prisma);

  // 2. Teams (Create teams first with null managerId to avoid circular dependency)
  const teamsData = [
    { id: "team-support-a", name: "Support Team A" },
    { id: "team-support-b", name: "Support Team B" },
    { id: "team-retail-desk", name: "Retail Desk" },
    { id: "team-escalations", name: "Escalations" },
  ];

  for (const team of teamsData) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: { name: team.name },
      create: {
        id: team.id,
        name: team.name,
      },
    });
  }

  // 3. Password hash for all demo users (demo1234, cost 10)
  const passwordHash = bcrypt.hashSync("demo1234", 10);
  const now = new Date();

  // 4. Admin User
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@shiftly.demo" },
    select: { onboardedAt: true },
  });

  await prisma.user.upsert({
    where: { email: "admin@shiftly.demo" },
    update: {
      name: "Aditya Rao",
      passwordHash,
      role: Role.ADMIN,
      avatarKey: "buddy-1",
      xp: 1200,
      level: Math.floor(1200 / 200) + 1,
      currentStreak: 5,
      bestStreak: 14,
      lastActiveDate: now,
      onboardedAt: existingAdmin?.onboardedAt ?? now,
    },
    create: {
      id: "user-admin",
      name: "Aditya Rao",
      email: "admin@shiftly.demo",
      passwordHash,
      role: Role.ADMIN,
      avatarKey: "buddy-1",
      xp: 1200,
      level: Math.floor(1200 / 200) + 1,
      currentStreak: 5,
      bestStreak: 14,
      lastActiveDate: now,
      onboardedAt: now,
    },
  });

  // 5. 4 Managers (one per team, member of that team, and set as managerId)
  const managersData = [
    {
      id: "user-mgr-support-a",
      name: "Aarav Sharma",
      email: "manager.a@shiftly.demo",
      teamId: "team-support-a",
      avatarKey: "buddy-2",
      xp: 1800,
      currentStreak: 8,
      bestStreak: 20,
    },
    {
      id: "user-mgr-support-b",
      name: "Priya Patel",
      email: "manager.b@shiftly.demo",
      teamId: "team-support-b",
      avatarKey: "buddy-3",
      xp: 1650,
      currentStreak: 6,
      bestStreak: 18,
    },
    {
      id: "user-mgr-retail",
      name: "Rohan Gupta",
      email: "manager.retail@shiftly.demo",
      teamId: "team-retail-desk",
      avatarKey: "buddy-4",
      xp: 2100,
      currentStreak: 12,
      bestStreak: 25,
    },
    {
      id: "user-mgr-escalations",
      name: "Neha Verma",
      email: "manager.escalations@shiftly.demo",
      teamId: "team-escalations",
      avatarKey: "buddy-5",
      xp: 2350,
      currentStreak: 15,
      bestStreak: 30,
    },
  ];

  for (const mgr of managersData) {
    const existingMgr = await prisma.user.findUnique({
      where: { email: mgr.email },
      select: { onboardedAt: true },
    });
    const level = Math.floor(mgr.xp / 200) + 1;
    await prisma.user.upsert({
      where: { email: mgr.email },
      update: {
        name: mgr.name,
        passwordHash,
        role: Role.MANAGER,
        avatarKey: mgr.avatarKey,
        teamId: mgr.teamId,
        xp: mgr.xp,
        level,
        currentStreak: mgr.currentStreak,
        bestStreak: mgr.bestStreak,
        lastActiveDate: now,
        onboardedAt: existingMgr?.onboardedAt ?? now,
      },
      create: {
        id: mgr.id,
        name: mgr.name,
        email: mgr.email,
        passwordHash,
        role: Role.MANAGER,
        avatarKey: mgr.avatarKey,
        teamId: mgr.teamId,
        xp: mgr.xp,
        level,
        currentStreak: mgr.currentStreak,
        bestStreak: mgr.bestStreak,
        lastActiveDate: now,
        onboardedAt: now,
      },
    });

    // Link team managerId to the manager user
    await prisma.team.update({
      where: { id: mgr.teamId },
      data: { managerId: mgr.id },
    });
  }

  // 6. 15 Employees with Indian names spread across the 4 teams
  const employeesData = [
    // Support Team A (4 employees)
    {
      id: "user-emp-aarohi",
      name: "Aarohi Joshi",
      email: "aarohi@shiftly.demo",
      teamId: "team-support-a",
      xp: 850,
      currentStreak: 4,
      bestStreak: 9,
      avatarKey: "buddy-1",
      daysAgoActive: 0,
    },
    {
      id: "user-emp-vikram",
      name: "Vikram Singh",
      email: "vikram@shiftly.demo",
      teamId: "team-support-a",
      xp: 1420,
      currentStreak: 7,
      bestStreak: 14,
      avatarKey: "buddy-2",
      daysAgoActive: 1,
    },
    {
      id: "user-emp-ananya",
      name: "Ananya Iyer",
      email: "ananya@shiftly.demo",
      teamId: "team-support-a",
      xp: 320,
      currentStreak: 2,
      bestStreak: 5,
      avatarKey: "buddy-3",
      daysAgoActive: 2,
    },
    {
      id: "user-emp-kavya",
      name: "Kavya Nair",
      email: "kavya@shiftly.demo",
      teamId: "team-support-a",
      xp: 1980,
      currentStreak: 11,
      bestStreak: 22,
      avatarKey: "buddy-4",
      daysAgoActive: 0,
    },

    // Support Team B (4 employees)
    {
      id: "user-emp-siddharth",
      name: "Siddharth Malhotra",
      email: "siddharth@shiftly.demo",
      teamId: "team-support-b",
      xp: 620,
      currentStreak: 3,
      bestStreak: 8,
      avatarKey: "buddy-5",
      daysAgoActive: 1,
    },
    {
      id: "user-emp-diya",
      name: "Diya Mehra",
      email: "diya@shiftly.demo",
      teamId: "team-support-b",
      xp: 1240,
      currentStreak: 6,
      bestStreak: 12,
      avatarKey: "buddy-6",
      daysAgoActive: 0,
    },
    {
      id: "user-emp-arjun",
      name: "Arjun Kapoor",
      email: "arjun@shiftly.demo",
      teamId: "team-support-b",
      xp: 2150,
      currentStreak: 14,
      bestStreak: 28,
      avatarKey: "buddy-1",
      daysAgoActive: 0,
    },
    {
      id: "user-emp-ishaan",
      name: "Ishaan Das",
      email: "ishaan@shiftly.demo",
      teamId: "team-support-b",
      xp: 180,
      currentStreak: 1,
      bestStreak: 3,
      avatarKey: "buddy-2",
      daysAgoActive: 2,
    },

    // Retail Desk (4 employees)
    {
      id: "user-emp-meera",
      name: "Meera Reddy",
      email: "meera@shiftly.demo",
      teamId: "team-retail-desk",
      xp: 940,
      currentStreak: 5,
      bestStreak: 10,
      avatarKey: "buddy-3",
      daysAgoActive: 1,
    },
    {
      id: "user-emp-kabir",
      name: "Kabir Chawla",
      email: "kabir@shiftly.demo",
      teamId: "team-retail-desk",
      xp: 1680,
      currentStreak: 9,
      bestStreak: 16,
      avatarKey: "buddy-4",
      daysAgoActive: 0,
    },
    {
      id: "user-emp-tanvi",
      name: "Tanvi Deshmukh",
      email: "tanvi@shiftly.demo",
      teamId: "team-retail-desk",
      xp: 460,
      currentStreak: 2,
      bestStreak: 6,
      avatarKey: "buddy-5",
      daysAgoActive: 3,
    },
    {
      id: "user-emp-rahul",
      name: "Rahul Saxena",
      email: "rahul@shiftly.demo",
      teamId: "team-retail-desk",
      xp: 2380,
      currentStreak: 16,
      bestStreak: 32,
      avatarKey: "buddy-6",
      daysAgoActive: 0,
    },

    // Escalations (3 employees)
    {
      id: "user-emp-sneha",
      name: "Sneha Bhatt",
      email: "sneha@shiftly.demo",
      teamId: "team-escalations",
      xp: 1150,
      currentStreak: 5,
      bestStreak: 11,
      avatarKey: "buddy-1",
      daysAgoActive: 1,
    },
    {
      id: "user-emp-dev",
      name: "Dev Mukherjee",
      email: "dev@shiftly.demo",
      teamId: "team-escalations",
      xp: 80,
      currentStreak: 1,
      bestStreak: 2,
      avatarKey: "buddy-2",
      daysAgoActive: 2,
    },
    {
      id: "user-emp-pooja",
      name: "Pooja Pillai",
      email: "pooja@shiftly.demo",
      teamId: "team-escalations",
      xp: 1890,
      currentStreak: 10,
      bestStreak: 21,
      avatarKey: "buddy-3",
      daysAgoActive: 0,
    },
  ];

  for (const emp of employeesData) {
    const existingEmp = await prisma.user.findUnique({
      where: { email: emp.email },
      select: { onboardedAt: true },
    });
    const level = Math.floor(emp.xp / 200) + 1;
    const lastActive = new Date(Date.now() - emp.daysAgoActive * 86400000);

    await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        name: emp.name,
        passwordHash,
        role: Role.EMPLOYEE,
        avatarKey: emp.avatarKey,
        teamId: emp.teamId,
        xp: emp.xp,
        level,
        currentStreak: emp.currentStreak,
        bestStreak: emp.bestStreak,
        lastActiveDate: lastActive,
        onboardedAt: existingEmp?.onboardedAt ?? now,
      },
      create: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        passwordHash,
        role: Role.EMPLOYEE,
        avatarKey: emp.avatarKey,
        teamId: emp.teamId,
        xp: emp.xp,
        level,
        currentStreak: emp.currentStreak,
        bestStreak: emp.bestStreak,
        lastActiveDate: lastActive,
        onboardedAt: now,
      },
    });

    // 5 XpEvents for each employee spread over the last 14 days
    const xpEventConfigs = [
      { index: 1, source: XpSource.SCENARIO, amount: 50, daysAgo: 1, refId: "scenario-seed-1" },
      { index: 2, source: XpSource.HABIT, amount: 20, daysAgo: 3, refId: "habit-log-seed-1" },
      { index: 3, source: XpSource.QUEST, amount: 40, daysAgo: 6, refId: "quest-seed-1" },
      { index: 4, source: XpSource.CHALLENGE, amount: 60, daysAgo: 9, refId: "challenge-seed-1" },
      { index: 5, source: XpSource.BADGE, amount: 100, daysAgo: 12, refId: "badge-seed-1" },
    ];

    for (const conf of xpEventConfigs) {
      const eventId = `xp-${emp.id}-${conf.index}`;
      const eventCreatedAt = new Date(Date.now() - conf.daysAgo * 86400000);

      await prisma.xpEvent.upsert({
        where: { id: eventId },
        update: {
          source: conf.source,
          amount: conf.amount,
          refId: conf.refId,
          createdAt: eventCreatedAt,
        },
        create: {
          id: eventId,
          userId: emp.id,
          source: conf.source,
          amount: conf.amount,
          refId: conf.refId,
          createdAt: eventCreatedAt,
        },
      });
    }
  }

  // 7. Habit Templates (6)
  const habitTemplatesData = [
    {
      id: "tpl-punctuality",
      title: "Punctuality",
      icon: "clock",
      description: "Start shifts and join scheduled customer meetings promptly.",
    },
    {
      id: "tpl-effective-comm",
      title: "Effective Communication",
      icon: "chat",
      description: "Use clear, concise, and empathetic language in every conversation.",
    },
    {
      id: "tpl-task-completion",
      title: "Task Completion",
      icon: "check-circle",
      description: "Close or update all pending customer tickets before clocking out.",
    },
    {
      id: "tpl-teamwork",
      title: "Teamwork",
      icon: "users",
      description: "Collaborate proactively and support teammates during high ticket volumes.",
    },
    {
      id: "tpl-customer-followup",
      title: "Customer Follow-up",
      icon: "phone-call",
      description: "Deliver on customer callbacks and promises within agreed turnaround times.",
    },
    {
      id: "tpl-daily-learning",
      title: "Daily Learning",
      icon: "book-open",
      description: "Spend 10 minutes practicing scenarios or reviewing updated internal SOPs.",
    },
  ];

  for (const tpl of habitTemplatesData) {
    await prisma.habitTemplate.upsert({
      where: { id: tpl.id },
      update: {
        title: tpl.title,
        icon: tpl.icon,
        description: tpl.description,
      },
      create: tpl,
    });
  }

  // 8. Badges (8)
  const badgesData = [
    {
      id: "badge-first-steps",
      key: "first-steps",
      name: "First Steps",
      description: "Completed your first customer service training scenario.",
      objectKey: "badge-footsteps",
      ruleType: "scenarios_completed",
      ruleValue: 1,
    },
    {
      id: "badge-streak-7",
      key: "streak-7",
      name: "7-Day Streak",
      description: "Maintained active learning or habit streaks for 7 consecutive days.",
      objectKey: "badge-flame-bronze",
      ruleType: "streak_days",
      ruleValue: 7,
    },
    {
      id: "badge-streak-30",
      key: "streak-30",
      name: "30-Day Master",
      description: "Maintained active learning or habit streaks for 30 consecutive days.",
      objectKey: "badge-flame-gold",
      ruleType: "streak_days",
      ruleValue: 30,
    },
    {
      id: "badge-perfect-score",
      key: "perfect-score",
      name: "Flawless Service",
      description: "Scored 100% on any customer service training scenario.",
      objectKey: "badge-star",
      ruleType: "perfect_scores",
      ruleValue: 1,
    },
    {
      id: "badge-complaint-crusher",
      key: "complaint-crusher",
      name: "Complaint Crusher",
      description: "Mastered all Handling Complaints scenarios with top stars.",
      objectKey: "badge-shield",
      ruleType: "category_stars",
      ruleValue: 12,
    },
    {
      id: "badge-query-master",
      key: "query-master",
      name: "Query Master",
      description: "Successfully resolved 10 customer query scenarios.",
      objectKey: "badge-sparkle",
      ruleType: "scenarios_completed",
      ruleValue: 10,
    },
    {
      id: "badge-boss-slayer",
      key: "boss-slayer",
      name: "Boss Slayer",
      description: "Successfully handled and won a high-stakes AI customer live call.",
      objectKey: "badge-trophy",
      ruleType: "boss_wins",
      ruleValue: 1,
    },
    {
      id: "badge-team-player",
      key: "team-player",
      name: "Team Player",
      description: "Completed 5 team assignments assigned by your manager.",
      objectKey: "badge-hands",
      ruleType: "team_assignments",
      ruleValue: 5,
    },
  ];

  for (const b of badgesData) {
    await prisma.badge.upsert({
      where: { key: b.key },
      update: {
        name: b.name,
        description: b.description,
        objectKey: b.objectKey,
        ruleType: b.ruleType,
        ruleValue: b.ruleValue,
      },
      create: b,
    });
  }

  // 9. Log counts at the end of the seed (no secrets)
  const [catCount, scenarioCount, teamCount, userCount, tplCount, badgeCount, xpCount] = await Promise.all([
    prisma.category.count(),
    prisma.scenario.count(),
    prisma.team.count(),
    prisma.user.count(),
    prisma.habitTemplate.count(),
    prisma.badge.count(),
    prisma.xpEvent.count(),
  ]);

  console.log("-----------------------------------------");
  console.log("Shiftly seed completed successfully!");
  console.log(`- Categories:      ${catCount}`);
  console.log(`- Scenarios:       ${scenarioCount}`);
  console.log(`- Teams:           ${teamCount}`);
  console.log(`- Users:           ${userCount}`);
  console.log(`- Habit Templates: ${tplCount}`);
  console.log(`- Badges:          ${badgeCount}`);
  console.log(`- XP Events:       ${xpCount}`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
