import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";
import type { PrismaClient, User } from "@/generated/prisma/client";
import { registerSchema, toFieldErrors } from "./validation";

// Cost 10 dummy hash for constant-time comparisons when user doesn't exist
const DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiMZe7B7Wd2jTzGf9oK5K9T81Z66WkS";

export async function verifyCredentials(
  prisma: PrismaClient,
  email: string,
  password: string,
): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return null;
  }

  return user;
}

export type CreateEmployeeResult =
  | { ok: true; user: User }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createEmployee(
  prisma: PrismaClient,
  input: unknown,
): Promise<CreateEmployeeResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { name, email, password, teamId } = parsed.data;

  // Check team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });
  if (!team) {
    return {
      ok: false,
      error: "Selected team does not exist",
      fieldErrors: { teamId: "Selected team does not exist" },
    };
  }

  // Check case-insensitive unique email
  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });
  if (existing) {
    return {
      ok: false,
      error: "Email is already registered",
      fieldErrors: { email: "Email is already registered" },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.EMPLOYEE,
      teamId,
      avatarKey: "buddy-1",
    },
  });

  return { ok: true, user };
}
