import { describe, expect, it } from "vitest";
import { completeOnboardingSchema, toFieldErrors } from "./validation";

describe("completeOnboardingSchema", () => {
  it("accepts a known buddy", () => {
    const result = completeOnboardingSchema.safeParse({ avatarKey: "buddy-1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.avatarKey).toBe("buddy-1");
  });

  it("rejects an unknown avatarKey", () => {
    const result = completeOnboardingSchema.safeParse({ avatarKey: "buddy-7" });
    expect(result.success).toBe(false);
    if (!result.success) expect(toFieldErrors(result.error).avatarKey).toBeDefined();
  });

  it("rejects missing fields", () => {
    const result = completeOnboardingSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) expect(toFieldErrors(result.error).avatarKey).toBeDefined();
  });
});
