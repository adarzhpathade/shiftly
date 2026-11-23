"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn, signOut } from "./index";
import { db } from "@/server/db";
import { createEmployee } from "./core";
import { loginSchema, toFieldErrors } from "./validation";
import type { RegistrationTeam } from "@/lib/types";
import type { ActionResult } from "./types";

export async function loginAction(
  input: FormData | { email: string; password: string },
): Promise<ActionResult> {
  let raw: { email: string; password: string };
  if (input instanceof FormData) {
    raw = {
      email: String(input.get("email") ?? ""),
      password: String(input.get("password") ?? ""),
    };
  } else {
    raw = input;
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid email or password.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    if (
      err instanceof AuthError ||
      err instanceof CredentialsSignin ||
      (err as { type?: string })?.type === "CredentialsSignin"
    ) {
      return { ok: false, error: "Invalid email or password." };
    }
    return { ok: false, error: "Invalid email or password." };
  }
}

export async function registerAction(input: {
  name: string;
  email: string;
  password: string;
  teamId: string;
}): Promise<ActionResult> {
  const result = await createEmployee(db, input);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      redirect: false,
    });
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    // Return ok: true if the employee was created successfully
    return { ok: true };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

/** TODO(Mayur): add memberCount (count of users per team) for the register ID card; see docs/contract-auto-habits.md. */
export async function listTeamsForRegistration(): Promise<RegistrationTeam[]> {
  const teams = await db.team.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  return teams;
}
