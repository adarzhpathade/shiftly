import { isBuddyKey, type BuddyKey } from "@/assets/stickers";

export { isBuddyKey };
export type { BuddyKey };

export function parseBuddyKey(raw: unknown): BuddyKey | null {
  return typeof raw === "string" && isBuddyKey(raw) ? raw : null;
}
