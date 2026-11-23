import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/server", () => ({
  after: vi.fn((cb: () => unknown) => cb()),
}));

// In-memory mock database state
interface MockUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface MockPasswordResetCode {
  id: string;
  userId: string | null;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  usedAt: Date | null;
  createdAt: Date;
}

let mockUsers: MockUser[] = [];
let mockResetCodes: MockPasswordResetCode[] = [];

vi.mock("@/server/db", () => ({
  db: {
    user: {
      findFirst: vi.fn(async ({ where }: { where: { email: { equals: string; mode?: string } } }) => {
        const target = where.email.equals.toLowerCase();
        return mockUsers.find((u) => u.email.toLowerCase() === target) ?? null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockUser> }) => {
        const user = mockUsers.find((u) => u.id === where.id);
        if (!user) throw new Error("User not found");
        Object.assign(user, data);
        return user;
      }),
    },
    passwordResetCode: {
      findMany: vi.fn(
        async ({
          where,
        }: {
          where: { email: string; createdAt?: { gte?: Date } };
          orderBy?: { createdAt: "asc" | "desc" };
        }) => {
          return mockResetCodes
            .filter((c) => {
              if (c.email !== where.email) return false;
              if (where.createdAt?.gte && c.createdAt < where.createdAt.gte) return false;
              return true;
            })
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        },
      ),
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: {
            email: string;
            userId?: { not: null };
            usedAt?: null;
          };
          orderBy?: { createdAt: "desc" };
        }) => {
          const matching = mockResetCodes
            .filter((c) => {
              if (c.email !== where.email) return false;
              if (where.userId?.not === null && c.userId === null) return false;
              if (where.usedAt === null && c.usedAt !== null) return false;
              return true;
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return matching[0] ?? null;
        },
      ),
      create: vi.fn(async ({ data }: { data: Omit<MockPasswordResetCode, "id" | "createdAt"> }) => {
        const row: MockPasswordResetCode = {
          id: `code-${mockResetCodes.length + 1}`,
          userId: data.userId ?? null,
          email: data.email,
          codeHash: data.codeHash,
          expiresAt: data.expiresAt,
          attempts: data.attempts ?? 0,
          usedAt: data.usedAt ?? null,
          createdAt: new Date(),
        };
        mockResetCodes.push(row);
        return row;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MockPasswordResetCode> & { attempts?: number | { increment: number } };
        }) => {
          const row = mockResetCodes.find((c) => c.id === where.id);
          if (!row) throw new Error("Code not found");
          if (data.attempts !== undefined) {
            if (typeof data.attempts === "object" && data.attempts !== null && "increment" in data.attempts) {
              row.attempts += (data.attempts as { increment: number }).increment;
            } else {
              row.attempts = data.attempts as number;
            }
          }
          if (data.usedAt !== undefined) row.usedAt = data.usedAt;
          if (data.expiresAt !== undefined) row.expiresAt = data.expiresAt;
          if (data.codeHash !== undefined) row.codeHash = data.codeHash;
          return row;
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { userId: string; usedAt: null };
          data: Partial<MockPasswordResetCode>;
        }) => {
          let count = 0;
          for (const row of mockResetCodes) {
            if (row.userId === where.userId && row.usedAt === null) {
              Object.assign(row, data);
              count++;
            }
          }
          return { count };
        },
      ),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      return cb((await import("@/server/db")).db);
    }),
  },
}));

const mockSendResetCode = vi.fn().mockResolvedValue(undefined);
vi.mock("./mailer", () => ({
  sendResetCode: (...args: unknown[]) => mockSendResetCode(...args),
}));

import bcrypt from "bcryptjs";
import { realPasswordResetRepo } from "./repository";

describe("realPasswordResetRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsers = [
      {
        id: "user-1",
        name: "Test User",
        email: "known@shiftly.com",
        passwordHash: "$2a$10$oldpasswordhasholdpasswordhasholdpasswordha",
      },
    ];
    mockResetCodes = [];
  });

  describe("requestCode", () => {
    it("returns invalid for malformed email", async () => {
      const res = await realPasswordResetRepo.requestCode("not-an-email");
      expect(res).toEqual({
        ok: false,
        reason: "invalid",
        field: "email",
        message: "Enter a valid email address.",
      });
      expect(mockSendResetCode).not.toHaveBeenCalled();
    });

    it("returns ok for known email, sends email, stores hashed code, and invalidates older unused codes", async () => {
      const res = await realPasswordResetRepo.requestCode("known@shiftly.com");
      expect(res).toEqual({ ok: true });

      expect(mockSendResetCode).toHaveBeenCalledTimes(1);
      const call = mockSendResetCode.mock.calls[0] as [string, string];
      expect(call).toBeDefined();
      const [to, code] = call;
      expect(to).toBe("known@shiftly.com");
      expect(code).toMatch(/^\d{6}$/);

      expect(mockResetCodes).toHaveLength(1);
      const saved = mockResetCodes[0]!;
      expect(saved.userId).toBe("user-1");
      expect(saved.email).toBe("known@shiftly.com");
      expect(saved.usedAt).toBeNull();
      expect(saved.attempts).toBe(0);
      expect(saved.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Code is stored hashed, not plain
      expect(saved.codeHash).not.toBe(code);
      const isMatch = await bcrypt.compare(code, saved.codeHash);
      expect(isMatch).toBe(true);
    });

    it("returns ok for unknown email, does not send email, but stores a ghost row (same response)", async () => {
      const res = await realPasswordResetRepo.requestCode("unknown@shiftly.com");
      expect(res).toEqual({ ok: true });

      // Privacy: no email is sent for unknown users
      expect(mockSendResetCode).not.toHaveBeenCalled();

      // But a ghost row is inserted with userId = null and usedAt set
      expect(mockResetCodes).toHaveLength(1);
      const ghost = mockResetCodes[0]!;
      expect(ghost.userId).toBeNull();
      expect(ghost.email).toBe("unknown@shiftly.com");
      expect(ghost.usedAt).toBeInstanceOf(Date);
      expect(ghost.attempts).toBe(0);
    });

    it("returns ok and does not throw even if mailer fails for known user", async () => {
      mockSendResetCode.mockRejectedValueOnce(new Error("SMTP connection failed"));
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await realPasswordResetRepo.requestCode("known@shiftly.com");
      expect(res).toEqual({ ok: true });

      // Code was still created in DB
      expect(mockResetCodes).toHaveLength(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[password-reset] Failed to send reset email");

      consoleErrorSpy.mockRestore();
    });

    it("enforces rate limit of max 3 requests per hour for known email", async () => {
      // 3 requests should succeed
      expect((await realPasswordResetRepo.requestCode("known@shiftly.com")).ok).toBe(true);
      expect((await realPasswordResetRepo.requestCode("known@shiftly.com")).ok).toBe(true);
      expect((await realPasswordResetRepo.requestCode("known@shiftly.com")).ok).toBe(true);

      // 4th request within 1 hour must be rate-limited
      const res4 = await realPasswordResetRepo.requestCode("known@shiftly.com");
      expect(res4.ok).toBe(false);
      if (!res4.ok) {
        expect(res4.reason).toBe("rate-limited");
        expect("retryAfterSeconds" in res4 && res4.retryAfterSeconds).toBeGreaterThan(0);
      }
    });

    it("enforces rate limit of max 3 requests per hour for unknown email using ghost rows", async () => {
      // 3 requests for unknown email create 3 ghost rows
      expect((await realPasswordResetRepo.requestCode("ghost@shiftly.com")).ok).toBe(true);
      expect((await realPasswordResetRepo.requestCode("ghost@shiftly.com")).ok).toBe(true);
      expect((await realPasswordResetRepo.requestCode("ghost@shiftly.com")).ok).toBe(true);

      // 4th request is rate-limited identically
      const res4 = await realPasswordResetRepo.requestCode("ghost@shiftly.com");
      expect(res4.ok).toBe(false);
      if (!res4.ok) {
        expect(res4.reason).toBe("rate-limited");
        expect("retryAfterSeconds" in res4 && res4.retryAfterSeconds).toBeGreaterThan(0);
      }
    });

    it("invalidates older unused codes when a new code is requested", async () => {
      await realPasswordResetRepo.requestCode("known@shiftly.com");
      const code1 = mockResetCodes[0]!;
      expect(code1.usedAt).toBeNull();

      await realPasswordResetRepo.requestCode("known@shiftly.com");
      const code2 = mockResetCodes[1]!;
      expect(code1.usedAt).not.toBeNull();
      expect(code2.usedAt).toBeNull();
    });
  });

  describe("verifyAndReset", () => {
    it("returns invalid for malformed email", async () => {
      const res = await realPasswordResetRepo.verifyAndReset("bad-email", "123456", "newpassword123");
      expect(res).toEqual({
        ok: false,
        reason: "invalid",
        field: "email",
        message: "Enter a valid email address.",
      });
    });

    it("returns invalid for new password under 8 characters", async () => {
      const res = await realPasswordResetRepo.verifyAndReset("known@shiftly.com", "123456", "short");
      expect(res).toEqual({
        ok: false,
        reason: "invalid",
        field: "newPassword",
        message: "Password must be at least 8 characters",
      });
    });

    it("returns invalid for unknown email without leaking existence", async () => {
      const res = await realPasswordResetRepo.verifyAndReset("unknown@shiftly.com", "123456", "newpassword123");
      expect(res).toEqual({
        ok: false,
        reason: "invalid",
        field: "code",
        message: "That code is not right.",
      });
    });

    it("resets password successfully with correct code in a single transaction", async () => {
      await realPasswordResetRepo.requestCode("known@shiftly.com");
      const sentCode = (mockSendResetCode.mock.calls[0] as [string, string])[1];

      const res = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        sentCode,
        "supersecurepassword123",
      );

      expect(res).toEqual({ ok: true });

      // User password was updated
      const user = mockUsers.find((u) => u.id === "user-1")!;
      const matchNew = await bcrypt.compare("supersecurepassword123", user.passwordHash);
      expect(matchNew).toBe(true);

      // Code is now marked as used
      const codeRow = mockResetCodes[0]!;
      expect(codeRow.usedAt).not.toBeNull();
    });

    it("counts wrong tries atomically and returns attemptsLeft", async () => {
      await realPasswordResetRepo.requestCode("known@shiftly.com");

      const res = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        "000000",
        "newpassword123",
      );

      expect(res).toEqual({
        ok: false,
        reason: "invalid",
        field: "code",
        message: "That code is not right.",
        attemptsLeft: 4,
      });

      expect(mockResetCodes[0]!.attempts).toBe(1);
    });

    it("locks the code after 5 wrong tries (returns too-many-tries)", async () => {
      await realPasswordResetRepo.requestCode("known@shiftly.com");

      // Attempts 1 to 4
      for (let i = 1; i <= 4; i++) {
        const res = await realPasswordResetRepo.verifyAndReset(
          "known@shiftly.com",
          "000000",
          "newpassword123",
        );
        expect(res.ok).toBe(false);
        if (!res.ok && res.reason === "invalid") {
          expect(res.attemptsLeft).toBe(5 - i);
        }
      }

      // 5th attempt burns the code
      const res5 = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        "000000",
        "newpassword123",
      );
      expect(res5).toEqual({ ok: false, reason: "too-many-tries" });

      // Further attempts also return too-many-tries
      const res6 = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        "000000",
        "newpassword123",
      );
      expect(res6).toEqual({ ok: false, reason: "too-many-tries" });
    });

    it("returns expired when code is older than 15 minutes", async () => {
      await realPasswordResetRepo.requestCode("known@shiftly.com");
      const sentCode = (mockSendResetCode.mock.calls[0] as [string, string])[1];

      // Expire the code
      mockResetCodes[0]!.expiresAt = new Date(Date.now() - 1000);

      const res = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        sentCode,
        "newpassword123",
      );

      expect(res).toEqual({ ok: false, reason: "expired" });
    });

    it("prevents reuse of an already used code", async () => {
      await realPasswordResetRepo.requestCode("known@shiftly.com");
      const sentCode = (mockSendResetCode.mock.calls[0] as [string, string])[1];

      // First use succeeds
      const res1 = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        sentCode,
        "newpassword123",
      );
      expect(res1).toEqual({ ok: true });

      // Second use fails (code was already marked usedAt)
      const res2 = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        sentCode,
        "anotherpassword123",
      );
      expect(res2).toEqual({
        ok: false,
        reason: "invalid",
        field: "code",
        message: "That code is not right.",
      });
    });

    it("invalidates older code after a new code request", async () => {
      // First code request
      await realPasswordResetRepo.requestCode("known@shiftly.com");
      const code1 = (mockSendResetCode.mock.calls[0] as [string, string])[1];

      // Second code request
      await realPasswordResetRepo.requestCode("known@shiftly.com");
      const code2 = (mockSendResetCode.mock.calls[1] as [string, string])[1];

      // First code should fail (it was invalidated)
      const resOld = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        code1,
        "newpassword123",
      );
      expect(resOld.ok).toBe(false);

      // Second code succeeds
      const resNew = await realPasswordResetRepo.verifyAndReset(
        "known@shiftly.com",
        code2,
        "newpassword123",
      );
      expect(resNew).toEqual({ ok: true });
    });
  });
});
