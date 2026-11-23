import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { createEmployee } from "../auth/core";
import { completeOnboardingCore } from "./core";

neonConfig.webSocketConstructor = ws;

function createTestPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

async function runOnboardingDbChecks() {
  const prisma = createTestPrismaClient();
  let createdUserId: string | null = null;

  try {
    const existingTeam = await prisma.team.findFirst();
    if (!existingTeam) {
      console.error("FAIL: No existing team found in the database");
      process.exitCode = 1;
      return;
    }

    // 1. Create a temporary user via createEmployee
    const testEmail = `check-onboard-${Date.now()}@shiftly.test`;
    const createResult = await createEmployee(prisma, {
      name: "Onboard Check Employee",
      email: testEmail,
      password: "password123",
      teamId: existingTeam.id,
    });

    if (!createResult.ok) {
      console.error(`FAIL: createEmployee failed: ${createResult.error}`);
      process.exitCode = 1;
      return;
    }

    createdUserId = createResult.user.id;
    console.log("PASS: createEmployee created temporary user for onboarding check");

    // Verify initial user state (avatarKey = buddy-1, onboardedAt = null)
    const initialUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: { avatarKey: true, onboardedAt: true },
    });
    if (!initialUser || initialUser.avatarKey !== "buddy-1" || initialUser.onboardedAt !== null) {
      console.error("FAIL: initial user does not have avatarKey buddy-1 or onboardedAt null");
      process.exitCode = 1;
      return;
    }
    console.log("PASS: initial user verified with avatarKey buddy-1 and onboardedAt null");

    // 2. Run completeOnboardingCore
    const firstResult = await completeOnboardingCore(
      prisma,
      createdUserId,
      { avatarKey: "buddy-4" },
    );

    if (!firstResult.ok) {
      console.error(`FAIL: completeOnboardingCore failed on first call: ${firstResult.error}`);
      process.exitCode = 1;
      return;
    }
    console.log("PASS: completeOnboardingCore returned ok: true on first call");

    // Assert user in DB: avatarKey changed to buddy-4 and onboardedAt is now set
    const updatedUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: { avatarKey: true, onboardedAt: true },
    });

    if (!updatedUser || updatedUser.avatarKey !== "buddy-4" || updatedUser.onboardedAt === null) {
      console.error("FAIL: user was not updated with avatarKey buddy-4 and non-null onboardedAt");
      process.exitCode = 1;
      return;
    }
    console.log("PASS: user updated with avatarKey buddy-4 and non-null onboardedAt");

    // 3. Second call: assert idempotent no-op
    const secondResult = await completeOnboardingCore(
      prisma,
      createdUserId,
      { avatarKey: "buddy-6" },
    );

    if (!secondResult.ok) {
      console.error(`FAIL: completeOnboardingCore failed on second call: ${secondResult.error}`);
      process.exitCode = 1;
      return;
    }

    const recheckedUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: { avatarKey: true, onboardedAt: true },
    });

    if (!recheckedUser || recheckedUser.avatarKey !== "buddy-4") {
      console.error("FAIL: second call mutated avatarKey despite being already onboarded");
      process.exitCode = 1;
      return;
    }
    console.log("PASS: second call was an idempotent no-op (avatarKey preserved)");
  } catch (err) {
    console.error("FAIL: Exception during onboarding db checks", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    if (createdUserId) {
      try {
        await prisma.user.delete({ where: { id: createdUserId } });
        console.log("PASS: Cleaned up temporary test user");
      } catch (cleanupErr) {
        console.error("FAIL: Failed to delete temporary test user during cleanup", cleanupErr);
      }
    }
    await prisma.$disconnect();
  }
}

runOnboardingDbChecks().catch((err) => {
  console.error("FAIL: Fatal error during onboarding db checks", err);
  process.exit(1);
});
