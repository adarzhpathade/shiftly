import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  toFieldErrors,
  formatZodErrors,
} from "./validation";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "admin@shiftly.demo",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@shiftly.demo");
      expect(result.data.password).toBe("password123");
    }
  });

  it("normalises email by trimming and lowercasing", () => {
    const result = loginSchema.safeParse({
      email: "  Admin@Shiftly.DEMO  ",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@shiftly.demo");
    }
  });

  it("rejects invalid email formats", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "admin@shiftly.demo",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validPayload = {
    name: "Aarohi Joshi",
    email: "aarohi@shiftly.demo",
    password: "password123",
    teamId: "team-1",
  };

  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Aarohi Joshi");
      expect(result.data.email).toBe("aarohi@shiftly.demo");
      expect(result.data.teamId).toBe("team-1");
    }
  });

  it("enforces name length bounds and trimming", () => {
    // 1 char fails
    expect(registerSchema.safeParse({ ...validPayload, name: "A" }).success).toBe(false);
    // 1 char after trim fails
    expect(registerSchema.safeParse({ ...validPayload, name: " A " }).success).toBe(false);
    // 2 chars succeeds
    expect(registerSchema.safeParse({ ...validPayload, name: "Al" }).success).toBe(true);
    // 60 chars succeeds
    expect(registerSchema.safeParse({ ...validPayload, name: "A".repeat(60) }).success).toBe(true);
    // 61 chars fails
    expect(registerSchema.safeParse({ ...validPayload, name: "A".repeat(61) }).success).toBe(false);
  });

  it("normalises registration email by lowercasing and trimming", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      email: "  NewUser@Shiftly.DEMO  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("newuser@shiftly.demo");
    }
  });

  it("rejects invalid registration email", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });

  it("enforces password minimum length of 8 characters", () => {
    expect(registerSchema.safeParse({ ...validPayload, password: "1234567" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validPayload, password: "12345678" }).success).toBe(true);
  });

  it("enforces non-empty teamId", () => {
    expect(registerSchema.safeParse({ ...validPayload, teamId: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validPayload, teamId: "   " }).success).toBe(false);
  });
});

describe("toFieldErrors", () => {
  it("turns a ZodError into Record<string, string>", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "bad",
      password: "short",
      teamId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = toFieldErrors(result.error);
      expect(fieldErrors.name).toBeTruthy();
      expect(fieldErrors.email).toBeTruthy();
      expect(fieldErrors.password).toBeTruthy();
      expect(fieldErrors.teamId).toBeTruthy();

      const aliasResult = formatZodErrors(result.error);
      expect(aliasResult).toEqual(fieldErrors);
    }
  });
});
