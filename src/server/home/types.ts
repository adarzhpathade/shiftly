export type CheckInActionResult =
  | {
      readonly ok: true;
      readonly xpEarned: number;
      readonly streak: number;
      readonly leveledUp?: number;
    }
  | {
      readonly ok: false;
      readonly error: string;
    };
