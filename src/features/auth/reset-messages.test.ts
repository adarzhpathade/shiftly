import { describe, expect, it } from "vitest";
import { CODE_SENT_TEXT, formatWait, requestNotice, verifyNotice } from "./reset-messages";

describe("reset-messages", () => {
  it("never says whether the account exists", () => {
    expect(CODE_SENT_TEXT).toBe("If this email has an account, we sent a 6-digit code.");
    expect(requestNotice({ ok: true })).toBeNull();
  });

  it("formats waits", () => {
    expect(formatWait(1)).toBe("1 second");
    expect(formatWait(45)).toBe("45 seconds");
    expect(formatWait(60)).toBe("1 minute");
    expect(formatWait(1800)).toBe("about 30 minutes");
    expect(formatWait(7200)).toBe("about 2 hours");
  });

  it("maps request branches", () => {
    expect(requestNotice({ ok: false, reason: "invalid", field: "email", message: "Enter a valid email address." })).toEqual({
      text: "Enter a valid email address.",
      field: "email",
      next: "fix",
    });
    const limited = requestNotice({ ok: false, reason: "rate-limited", retryAfterSeconds: 1800 });
    expect(limited?.next).toBe("wait");
    expect(limited?.text).toContain("about 30 minutes");
  });

  it("maps every verify branch", () => {
    expect(verifyNotice({ ok: true })).toBeNull();
    expect(
      verifyNotice({ ok: false, reason: "invalid", field: "code", message: "x", attemptsLeft: 3 }),
    ).toMatchObject({ field: "code", next: "fix", text: "That code is not right. 3 tries left." });
    expect(
      verifyNotice({ ok: false, reason: "invalid", field: "code", message: "x", attemptsLeft: 1 })?.text,
    ).toContain("1 try left");
    expect(verifyNotice({ ok: false, reason: "invalid", field: "code", message: "x" })?.text).toContain(
      "Check it and try again",
    );
    expect(
      verifyNotice({ ok: false, reason: "invalid", field: "newPassword", message: "Password must be at least 8 characters" }),
    ).toMatchObject({ field: "newPassword", text: "Password must be at least 8 characters" });
    expect(verifyNotice({ ok: false, reason: "expired" })).toMatchObject({ next: "resend", field: "code" });
    expect(verifyNotice({ ok: false, reason: "too-many-tries" })).toMatchObject({ next: "resend", field: "code" });
    const limited = verifyNotice({ ok: false, reason: "rate-limited", retryAfterSeconds: 90 });
    expect(limited).toMatchObject({ next: "wait", retryAfterSeconds: 90 });
    expect(limited?.text).toContain("about 2 minutes");
  });
});
