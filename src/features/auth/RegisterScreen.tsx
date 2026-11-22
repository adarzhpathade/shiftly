"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BracketHeadline, Button, Sticker, TextField } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { AuthShell } from "./AuthShell";
import { PasswordField } from "./PasswordField";
import { passwordStrength } from "./password-strength";
import type { FormResult } from "./types";

export type RegisterScreenProps = {
  teams: readonly { id: string; name: string }[];
  /** Creates the account. The host navigates away on `{ ok: true }`. */
  onSubmit: (input: {
    name: string;
    email: string;
    password: string;
    teamId: string;
  }) => Promise<FormResult>;
  loginHref: string;
};

const STRENGTH_BAR = ["bg-ink/15", "bg-red", "bg-peach", "bg-lime"] as const;

export function RegisterScreen({ teams, onSubmit, loginHref }: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");

  const [result, submit, pending] = useActionState<FormResult | null, FormData>(
    async (_prev, formData) => {
      try {
        return await onSubmit({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          teamId: String(formData.get("teamId") ?? ""),
        });
      } catch {
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null,
  );

  const failed = result && !result.ok ? result : null;
  const fieldErrors = failed?.fieldErrors ?? {};
  const strength = passwordStrength(password);

  return (
    <AuthShell>
      <div className="relative mt-8">
        <BracketHeadline size="h1" className="max-w-[250px]">
          {"Create your\n[account]"}
        </BracketHeadline>
        <Sticker pose="cheer" size={104} className="absolute -top-2 right-1 -rotate-6" />
      </div>
      <p className="mt-2 max-w-[220px] text-[15px] font-semibold text-ink-soft">
        It takes a minute. Then pick your buddy and first habits.
      </p>

      <form action={submit} noValidate className="mt-6 flex flex-col gap-4">
        {failed && Object.keys(fieldErrors).length === 0 && (
          <p role="alert" className="rounded-card bg-paper p-3 text-[14px] font-bold text-red">
            {failed.error}
          </p>
        )}

        <TextField
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Aarohi Joshi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />
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
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />
          <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-1.5 flex-1 rounded-pill transition-colors duration-300",
                  strength.level >= n ? STRENGTH_BAR[strength.level] : "bg-ink/15",
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-[13px] font-semibold text-ink-soft" aria-live="polite">
            {strength.text}
          </p>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-bold">Your team</legend>
          <div role="radiogroup" aria-label="Your team" className="flex flex-wrap gap-2">
            {teams.length === 0 && (
              <p className="text-[14px] font-semibold text-ink-soft">No teams available yet.</p>
            )}
            {teams.map((t) => {
              const on = t.id === teamId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTeamId(t.id)}
                  className={cn(
                    "min-h-11 rounded-pill px-4 text-[14px] font-extrabold ring-2 transition-transform duration-300 ease-spring active:scale-95",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
                    on ? "bg-ink text-cream ring-ink" : "bg-paper text-ink ring-muted",
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="teamId" value={teamId} />
          {fieldErrors.teamId && (
            <p role="alert" className="mt-1.5 text-[13px] font-bold text-red">
              {fieldErrors.teamId}
            </p>
          )}
        </fieldset>

        <Button type="submit" variant="ink" size="lg" fullWidth disabled={pending} className="mt-2">
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[15px] font-semibold text-ink-soft">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-extrabold text-lav-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
