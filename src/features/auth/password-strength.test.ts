import { describe, expect, it } from "vitest";
import { passwordStrength } from "./password-strength";

describe("passwordStrength", () => {
  it("handles empty and short passwords", () => {
    expect(passwordStrength("").level).toBe(0);
    expect(passwordStrength("abc")).toEqual({ level: 1, text: "5 more characters to go." });
    expect(passwordStrength("abcdefg").text).toBe("1 more character to go.");
  });

  it("rates 8+ characters as at least okay", () => {
    expect(passwordStrength("abcdefgh").level).toBe(2);
  });

  it("rates long or varied passwords as strong", () => {
    expect(passwordStrength("abcdefghijkl").level).toBe(3);
    expect(passwordStrength("Abcdef1!").level).toBe(3);
  });
});
