import type { BossResult, BossSession, BossStartResult } from "@/lib/types";

export type StartBossActionResult =
  | { readonly ok: true; readonly result: BossStartResult }
  | { readonly ok: false; readonly error: string };

export type GetBossSessionActionResult =
  | { readonly ok: true; readonly session: BossSession }
  | { readonly ok: false; readonly error: string };

export type FinishBossActionResult =
  | { readonly ok: true; readonly result: BossResult }
  | { readonly ok: false; readonly error: string };
