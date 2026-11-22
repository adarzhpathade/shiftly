"use server";

import { revalidatePath } from "next/cache";
import { unstable_update } from "@/server/auth";
import { requireViewer } from "@/server/auth/session";
import type { ActionResult } from "@/server/auth/types";
import { db } from "@/server/db";
import { isBuddyKey } from "./validation";

export async function saveBuddyAction(avatarKey: string): Promise<ActionResult> {
  const viewer = await requireViewer();
  if (!isBuddyKey(avatarKey)) {
    return { ok: false, error: "Pick one of the buddies" };
  }
  await db.user.update({
    where: { id: viewer.id },
    data: { avatarKey },
  });
  try {
    await unstable_update({
      user: { avatarKey },
    });
  } catch (err) {
    console.warn("Failed to update session avatarKey:", err);
  }
  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}
