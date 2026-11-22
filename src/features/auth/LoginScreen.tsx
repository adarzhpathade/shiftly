"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BracketHeadline, Button, Sticker, TextField } from "@/components/ui";
import { AuthShell } from "./AuthShell";
import { PasswordField } from "./PasswordField";
import type { DemoAccount, FormResult } from "./types";

export type LoginScreenProps = {
  /** Checks the credentials. The host navigates away on `{ ok: true }`. */
  onSubmit: (input: { email: string; password: string }) => Promise<FormResult>;
  registerHref: string;
  /** Shown as tap-to-fill helpers (demo mode only). */
  demoAccounts?: readonly DemoAccount[];
};

export function LoginScreen({ onSubmit, registerHref, demoAccounts }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [result, submit, pending] = useActionState<FormResult | null, FormData>(
    async (_prev, formData) => {
      try {
        return await onSubmit({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        });
      } catch {
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null,
  );

  const failed = result && !result.ok ? result : null;
  const fieldErrors = failed?.fieldErrors ?? {};

  return (
    <AuthShell>
      <div className="relative mt-8">
        <BracketHeadline size="h1" className="max-w-[240px]">
          {"Welcome\n[back]"}
        </BracketHeadline>
        <Sticker
          pose="wave"
          size={112}
          className="absolute -top-3 right-1 rotate-6"
        />
      </div>
      <p className="mt-2 max-w-[200px] text-[15px] font-semibold text-ink-soft">
        Log in to keep your streak.
      </p>

      <form action={submit} noValidate className="mt-6 flex flex-col gap-4">
        {failed && (!failed.fieldErrors || Object.keys(fieldErrors).length === 0) && (
          <p role="alert" className="rounded-card bg-paper p-3 text-[14px] font-bold text-red">
            {failed.error}
          </p>
        )}

        <TextField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" variant="ink" size="lg" fullWidth disabled={pending} className="mt-2">
          {pending ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[15px] font-semibold text-ink-soft">
        New here?{" "}
        <Link
          href={registerHref}
          className="font-extrabold text-lav-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          Create an account
        </Link>
      </p>

      {demoAccounts && demoAccounts.length > 0 && (
        <section
          aria-label="Demo login"
          className="mt-8 rounded-card border-2 border-dashed border-ink/25 p-3"
        >
          <p className="mb-2 text-[11px] font-bold tracking-[0.06em] text-ink-soft uppercase">
            Demo login
          </p>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                }}
                className="min-h-10 rounded-pill bg-paper px-3.5 text-[13px] font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink active:scale-95"
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12px] font-semibold text-ink-soft">
            Tap one to fill the form, then press Log in.
          </p>
        </section>
      )}
    </AuthShell>
  );
}
