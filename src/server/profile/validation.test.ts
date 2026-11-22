import { describe, expect, it } from "vitest";
import { isBuddyKey, parseBuddyKey } from "./validation";
import { BUDDY_KEYS } from "@/assets/stickers";

describe("profile buddy validation", () => {
  it("accepts all buddy keys", () => {
    for (const key of BUDDY_KEYS) {
      expect(isBuddyKey(key)).toBe(true);
      expect(parseBuddyKey(key)).toBe(key);
    }
  });

  it("rejects non-buddy keys", () => {
    expect(isBuddyKey("avatar-3")).toBe(false);
    expect(isBuddyKey(undefined)).toBe(false);
    expect(parseBuddyKey("avatar-3")).toBeNull();
    expect(parseBuddyKey(5)).toBeNull();
    expect(parseBuddyKey("")).toBeNull();
    expect(parseBuddyKey(null)).toBeNull();
  });
});
