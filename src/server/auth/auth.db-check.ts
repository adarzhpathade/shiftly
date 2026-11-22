import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { verifyCredentials, createEmployee } from "./core";

neonConfig.webSocketConstructor = ws;

function createTestPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

async function runDbChecks() {
  const prisma = createTestPrismaClient();
  let createdUserId: string | null = null;

  try {
    // (a) admin@shiftly.demo password demo1234 verifies
    const adminUser = await verifyCredentials(prisma, "admin@shiftly.demo", "demo1234");
    if (!adminUser || adminUser.email !== "admin@shiftly.demo") {
      console.error("FAIL: admin@shiftly.demo failed to verify with demo1234");
      process.exitCode = 1;
      return;
    }
    console.log("PASS: admin@shiftly.demo verified with demo1234");

    // (b) wrong password returns null
    const wrongPassUser = await verifyCredentials(prisma, "admin@shiftly.demo", "wrongpassword!");
    if (wrongPassUser !== null) {
      console.error("FAIL: wrong password returned a user instead of null");
      process.exitCode = 1;
      return;
    }
    console.log("PASS: wrong password returns null");

    // Retrieve an existing team for registration checks
    const existingTeam = await prisma.team.findFirst();
    if (!existingTeam) {
      console.error("FAIL: No existing team found in the database");
      process.exitCode = 1;
      return;
    }

    // (c) createEmployee rejects a duplicate email (admin@shiftly.demo) with fieldErrors.email
    const dupResult = await createEmployee(prisma, {
      name: "Duplicate Admin",
      email: "admin@shiftly.demo",
      password: "password123",
      teamId: existingTeam.id,
    });
    if (dupResult.ok || !dupResult.fieldErrors?.email) {
      console.error("FAIL: createEmployee did not reject duplicate email with fieldErrors.email");
      process.exitCode = 1;
      return;
    }
    console.log("PASS: createEmployee rejected duplicate email with fieldErrors.email");

    // (d) createEmployee for a fresh unique email in an existing team succeeds,
    // then verifyCredentials works for it, then DELETE that user
    const testEmail = `check-${Date.now()}@shiftly.test`;
    const createResult = await createEmployee(prisma, {
      name: "Fresh Test Employee",
      email: testEmail,
      password: "password123",
      teamId: existingTeam.id,
    });

    if (!createResult.ok) {
      console.error(`FAIL: createEmployee failed for fresh email: ${createResult.error}`);
      process.exitCode = 1;
      return;
    }
    createdUserId = createResult.user.id;
    console.log("PASS: createEmployee succeeded for fresh unique email");

    const verifiedFresh = await verifyCredentials(prisma, testEmail, "password123");
    if (!verifiedFresh || verifiedFresh.id !== createdUserId) {
      console.error("FAIL: verifyCredentials failed for fresh employee");
      process.exitCode = 1;
      return;
    }
    console.log("PASS: verifyCredentials succeeded for fresh employee");
  } catch (err) {
    console.error("FAIL: Exception thrown during DB checks", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    if (createdUserId) {
      try {
        await prisma.user.delete({ where: { id: createdUserId } });
        console.log("PASS: Cleaned up test user from database");
      } catch (cleanupErr) {
        console.error("FAIL: Failed to delete test user during cleanup", cleanupErr);
      }
    }
    await prisma.$disconnect();
  }
}

runDbChecks().catch((err) => {
  console.error("FAIL: Fatal error during db checks", err);
  process.exit(1);
});
