import type { CelebrationEvent } from "@/lib/celebrations";

export type CheckInActionResult =
  | {
      readonly ok: true;
      readonly xpEarned: number;
      readonly streak: number;
      readonly leveledUp?: number;
      readonly celebrations: CelebrationEvent[];
    }
  | {
      readonly ok: false;
      readonly error: string;
    };
