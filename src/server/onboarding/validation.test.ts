import { describe, expect, it } from "vitest";
import { completeOnboardingSchema, toFieldErrors } from "./validation";

describe("completeOnboardingSchema", () => {
  it("accepts valid input with 2 templates", () => {
    const input = {
      avatarKey: "buddy-1",
      templateIds: ["punctuality", "communication"],
    };
    const result = completeOnboardingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatarKey).toBe("buddy-1");
      expect(result.data.templateIds).toEqual(["punctuality", "communication"]);
    }
  });

  it("accepts valid input with 3 templates", () => {
    const input = {
      avatarKey: "buddy-6",
      templateIds: ["punctuality", "communication", "task-completion"],
    };
    const result = completeOnboardingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects unknown avatarKey", () => {
    const input = {
      avatarKey: "buddy-7",
      templateIds: ["punctuality", "communication"],
    };
    const result = completeOnboardingSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = toFieldErrors(result.error);
      expect(fieldErrors.avatarKey).toBeDefined();
    }
  });

  it("rejects 1 template (below minimum of 2)", () => {
    const input = {
      avatarKey: "buddy-2",
      templateIds: ["punctuality"],
    };
    const result = completeOnboardingSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = toFieldErrors(result.error);
      expect(fieldErrors.templateIds).toBeDefined();
    }
  });

  it("rejects 4 templates (above maximum of 3)", () => {
    const input = {
      avatarKey: "buddy-3",
      templateIds: ["punctuality", "communication", "task-completion", "teamwork"],
    };
    const result = completeOnboardingSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = toFieldErrors(result.error);
      expect(fieldErrors.templateIds).toBeDefined();
    }
  });

  it("rejects duplicate template ids", () => {
    const input = {
      avatarKey: "buddy-4",
      templateIds: ["punctuality", "punctuality"],
    };
    const result = completeOnboardingSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = toFieldErrors(result.error);
      expect(fieldErrors.templateIds).toBeDefined();
    }
  });

  it("rejects empty string template id", () => {
    const input = {
      avatarKey: "buddy-5",
      templateIds: ["punctuality", ""],
    };
    const result = completeOnboardingSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = toFieldErrors(result.error);
      expect(fieldErrors.templateIds).toBeDefined();
    }
  });

  it("rejects missing fields", () => {
    const emptyResult = completeOnboardingSchema.safeParse({});
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      const fieldErrors = toFieldErrors(emptyResult.error);
      expect(fieldErrors.avatarKey).toBeDefined();
      expect(fieldErrors.templateIds).toBeDefined();
    }

    const missingAvatar = completeOnboardingSchema.safeParse({
      templateIds: ["punctuality", "communication"],
    });
    expect(missingAvatar.success).toBe(false);

    const missingTemplates = completeOnboardingSchema.safeParse({
      avatarKey: "buddy-1",
    });
    expect(missingTemplates.success).toBe(false);
  });
});
