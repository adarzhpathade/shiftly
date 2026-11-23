"use server";

import { cookies } from "next/headers";
import { db } from "@/server/db";
import { requireViewer } from "@/server/auth/session";
import { unstable_update } from "@/server/auth";
import type { ActionResult } from "@/server/auth/types";
import { completeOnboardingSchema, toFieldErrors } from "./validation";
import { completeOnboardingCore } from "./core";

export async function completeOnboardingAction(input: {
  avatarKey: string;
}): Promise<ActionResult> {
  const viewer = await requireViewer();

  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const result = await completeOnboardingCore(db, viewer.id, parsed.data);

  if (!result.ok) {
    return result;
  }

  try {
    await unstable_update({
      user: {
        avatarKey: parsed.data.avatarKey,
      },
    });
  } catch (err) {
    console.warn("Failed to update session avatarKey:", err);
  }

  return { ok: true };
}

export async function markIntroSeenAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("seen_intro", "1", {
    maxAge: 365 * 24 * 60 * 60, // 1 year in seconds
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
