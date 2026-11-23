import "server-only";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { after } from "next/server";
import {
  RESET_CODE_LENGTH,
  RESET_CODE_TTL_MINUTES,
  RESET_MAX_ATTEMPTS,
  RESET_MAX_REQUESTS_PER_HOUR,
  RESET_MIN_PASSWORD_LENGTH,
} from "@/lib/password-reset";
import { registerSchema } from "@/server/auth/validation";
import type { PasswordResetRepository } from "@/data/repositories";
import type {
  PasswordResetRequestResult,
  PasswordResetVerifyResult,
} from "@/lib/types";
import { sendResetCode } from "./mailer";

const DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiMZe7B7Wd2jTzGf9oK5K9T81Z66WkS";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;

async function getDb() {
  const { db } = await import("@/server/db");
  return db;
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(): string {
  const max = 10 ** RESET_CODE_LENGTH;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(RESET_CODE_LENGTH, "0");
}

function scheduleEmail(to: string, code: string): void {
  const send = async () => {
    try {
      await sendResetCode(to, code);
    } catch {
      console.error("[password-reset] Failed to send reset email");
    }
  };

  try {
    after(send);
  } catch {
    // Fallback outside a request scope (tests, scripts)
    send().catch(() => {
      console.error("[password-reset] Failed to send reset email");
    });
  }
}

export const realPasswordResetRepo: PasswordResetRepository = {
  async requestCode(email: string): Promise<PasswordResetRequestResult> {
    const clean = normaliseEmail(email);
    if (!EMAIL_RE.test(clean)) {
      return {
        ok: false,
        reason: "invalid",
        field: "email",
        message: "Enter a valid email address.",
      };
    }

    const now = Date.now();
    const oneHourAgo = new Date(now - ONE_HOUR_MS);
    const db = await getDb();

    // Rate limit: max 3 requests per email per rolling hour (ghost rows count too)
    const recentRequests = await db.passwordResetCode.findMany({
      where: {
        email: clean,
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: "asc" },
    });

    if (recentRequests.length >= RESET_MAX_REQUESTS_PER_HOUR) {
      const oldest = recentRequests[0]?.createdAt.getTime() ?? now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + ONE_HOUR_MS - now) / 1000),
      );
      return { ok: false, reason: "rate-limited", retryAfterSeconds };
    }

    // Check if user exists (never reveal whether an account exists)
    const user = await db.user.findFirst({
      where: {
        email: {
          equals: clean,
          mode: "insensitive",
        },
      },
    });

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(now + RESET_CODE_TTL_MINUTES * 60 * 1000);

    if (user) {
      // Invalidate older unused codes for this user
      await db.passwordResetCode.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(now),
        },
      });

      // Insert new active reset code
      await db.passwordResetCode.create({
        data: {
          userId: user.id,
          email: clean,
          codeHash,
          expiresAt,
          attempts: 0,
        },
      });

      // Send without blocking the response so known/unknown paths take similar time
      scheduleEmail(user.email, code);
    } else {
      // Unknown email: insert ghost row (userId = null, usedAt set)
      // Preserves symmetry, timing and rate-limiting without sending email
      await db.passwordResetCode.create({
        data: {
          userId: null,
          email: clean,
          codeHash,
          expiresAt,
          attempts: 0,
          usedAt: new Date(now),
        },
      });
    }

    return { ok: true };
  },

  async verifyAndReset(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<PasswordResetVerifyResult> {
    const clean = normaliseEmail(email);
    if (!EMAIL_RE.test(clean)) {
      return {
        ok: false,
        reason: "invalid",
        field: "email",
        message: "Enter a valid email address.",
      };
    }

    const passwordCheck = registerSchema.shape.password.safeParse(newPassword);
    if (!passwordCheck.success) {
      const message =
        passwordCheck.error.issues[0]?.message ??
        `Password must be at least ${RESET_MIN_PASSWORD_LENGTH} characters`;
      return {
        ok: false,
        reason: "invalid",
        field: "newPassword",
        message,
      };
    }

    const db = await getDb();

    // Find the active, unused reset code for this email
    const activeCode = await db.passwordResetCode.findFirst({
      where: {
        email: clean,
        userId: { not: null },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeCode || !activeCode.userId) {
      // Unknown email or no active code: constant-time comparison to prevent timing leaks
      await bcrypt.compare(code, DUMMY_HASH);
      return {
        ok: false,
        reason: "invalid",
        field: "code",
        message: "That code is not right.",
      };
    }

    // Locked after max attempts
    if (activeCode.attempts >= RESET_MAX_ATTEMPTS) {
      return { ok: false, reason: "too-many-tries" };
    }

    // Expired after 15 minutes
    if (activeCode.expiresAt.getTime() <= Date.now()) {
      return { ok: false, reason: "expired" };
    }

    const isMatch = await bcrypt.compare(code.trim(), activeCode.codeHash);

    if (!isMatch) {
      // Atomic attempt counter increment
      const updated = await db.passwordResetCode.update({
        where: { id: activeCode.id },
        data: { attempts: { increment: 1 } },
      });

      if (updated.attempts >= RESET_MAX_ATTEMPTS) {
        return { ok: false, reason: "too-many-tries" };
      }

      return {
        ok: false,
        reason: "invalid",
        field: "code",
        message: "That code is not right.",
        attemptsLeft: RESET_MAX_ATTEMPTS - updated.attempts,
      };
    }

    // Successful code verification:
    // Hash new password using bcrypt (cost 10)
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const now = new Date();

    // In one transaction: update user password, mark current code used,
    // and invalidate all other unused codes for this user
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: activeCode.userId! },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetCode.updateMany({
        where: {
          userId: activeCode.userId!,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });
    });

    return { ok: true };
  },
};
