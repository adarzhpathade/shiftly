"use client";

import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BracketHeadline,
  Button,
  Rise,
  ShakeText,
  ShiftLoader,
  Stagger,
  StrengthMeter,
  TextField,
  cn,
  type BuddyKey,
} from "@/components/ui";
import type { RegistrationTeam } from "@/lib/types";
import { AuthShell } from "./AuthShell";
import { EmployeeIdCard } from "./EmployeeIdCard";
import { PasswordField } from "./PasswordField";
import { passwordStrength } from "./password-strength";
import type { FormResult } from "./types";

export type RegisterScreenProps = {
  teams: readonly RegistrationTeam[];
  /** Creates the account. Must NOT navigate: the screen calls `onSuccess` after the HIRED stamp. */
  onSubmit: (input: {
    name: string;
    email: string;
    password: string;
    teamId: string;
  }) => Promise<FormResult>;
  /** Continues to setup once the card is stamped. The screen then shows the ShiftLoader. */
  onSuccess?: () => void;
  loginHref: string;
  /** The buddy that pops into the photo slot. Defaults to Sunny. */
  buddy?: BuddyKey;
};

/** How long the HIRED stamp is shown before moving on. */
export const STAMP_MS = 1500;

const STEP_LABELS = ["Name", "Team", "Password"] as const;
const FIELD_STEP: Record<string, number> = { name: 0, email: 1, teamId: 1, password: 2 };

/** Three dots joined by a path that fills as the steps are done. */
function DotPath({ step }: { step: number }) {
  return (
    <ol aria-label="Sign-up progress" className="mx-auto flex w-full max-w-[320px] items-start">
      {STEP_LABELS.map((label, i) => (
        <li
          key={label}
          aria-current={i === step ? "step" : undefined}
          className={cn("flex items-start", i < STEP_LABELS.length - 1 && "flex-1")}
        >
          <span className="flex w-12 flex-col items-center gap-1">
            <span
              className={cn(
                "grid size-4 place-items-center rounded-full transition-all duration-300 ease-spring",
                i < step && "bg-ink",
                i === step && "scale-125 bg-lime ring-2 ring-ink",
                i > step && "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-bold",
                i === step ? "text-ink" : "text-ink-soft",
              )}
            >
              {label}
              <span className="sr-only">
                {i < step ? " done" : i === step ? ` (step ${i + 1} of 3)` : ""}
              </span>
            </span>
          </span>
          {i < STEP_LABELS.length - 1 && (
            <span aria-hidden="true" className="mt-[7px] h-0.5 flex-1 rounded-pill bg-muted">
              <span
                className="block h-full origin-left rounded-pill bg-ink transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${i < step ? 1 : 0})` }}
              />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function RegisterScreen({
  teams,
  onSubmit,
  onSuccess,
  loginHref,
  buddy = "buddy-1",
}: RegisterScreenProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<FormResult | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [stamped, setStamped] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const failed = result && !result.ok ? result : null;
  const fieldErrors = { ...(failed?.fieldErrors ?? {}), ...localErrors };
  const strength = passwordStrength(password);
  const team = teams.find((t) => t.id === teamId);

  function next() {
    const errors: Record<string, string> = {};
    if (step === 0 && !name.trim()) errors.name = "Tell us your name.";
    if (step === 1) {
      if (!email.trim()) errors.email = "Enter your email.";
      if (!teamId) errors.teamId = "Pick your team.";
    }
    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setResult(null);
    setStep((s) => Math.min(2, s + 1));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || stamped) return;
    if (step < 2) {
      next();
      return;
    }
    setPending(true);
    setLocalErrors({});
    let res: FormResult;
    try {
      res = await onSubmit({ name, email, password, teamId });
    } catch {
      res = { ok: false, error: "Something went wrong. Please try again." };
    }
    setResult(res);
    if (res.ok) {
      // Stay "pending" through the stamp and the hand-off.
      setStamped(true);
      timer.current = window.setTimeout(() => {
        setHandoff(true);
        onSuccess?.();
      }, STAMP_MS);
      return;
    }
    setPending(false);
    // Jump back to the earliest step that has a field error.
    const steps = Object.keys(res.fieldErrors ?? {}).map((k) => FIELD_STEP[k] ?? 2);
    if (steps.length > 0) setStep(Math.min(...steps));
  }

  return (
    <AuthShell>
      <Rise className="mt-5">
        <EmployeeIdCard
          name={name}
          team={team?.name ?? ""}
          memberCount={team?.memberCount}
          showPhoto={step >= 2 || stamped}
          buddy={buddy}
          stamped={stamped}
        />
      </Rise>
      <Rise className="mt-5">
        <DotPath step={step} />
      </Rise>

      <MotionConfig reducedMotion="user">
        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <div aria-live="assertive">
            {failed && Object.keys(fieldErrors).length === 0 && (
              <ShakeText
                role="alert"
                className="rounded-card bg-paper p-3 text-center text-[14px] font-bold text-red"
              >
                {failed.error}
              </ShakeText>
            )}
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="flex flex-col gap-4"
          >
            {step === 0 && (
              <>
                <BracketHeadline size="h2">{"What is your\n[name]?"}</BracketHeadline>
                <TextField
                  label="Name"
                  name="name"
                  autoComplete="name"
                  placeholder="Aarohi Joshi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fieldErrors.name}
                  autoFocus
                  required
                />
              </>
            )}

            {step === 1 && (
              <>
                <BracketHeadline size="h2">{"Where do you\n[work]?"}</BracketHeadline>
                <TextField
                  label="Work email"
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
                <fieldset>
                  <legend className="mb-1.5 text-[13px] font-bold">Your team</legend>
                  <div role="radiogroup" aria-label="Your team" className="grid grid-cols-2 gap-2">
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
                          onClick={() => {
                            setTeamId(t.id);
                            setLocalErrors((e) => ({ ...e, teamId: "" }));
                          }}
                          className={cn(
                            "flex min-h-14 flex-col justify-center rounded-[16px] px-3.5 py-1.5 text-left ring-2 transition-transform duration-300 ease-spring active:scale-[0.98]",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
                            on ? "bg-lime ring-ink" : "bg-paper ring-muted",
                          )}
                        >
                          <span className="text-[14px] leading-tight font-extrabold">{t.name}</span>
                          {t.memberCount !== undefined && (
                            <span className="text-[11px] font-bold text-ink-soft">
                              {t.memberCount} {t.memberCount === 1 ? "colleague" : "colleagues"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.teamId && (
                    <ShakeText role="alert" className="mt-1.5 text-[13px] font-bold text-red">
                      {fieldErrors.teamId}
                    </ShakeText>
                  )}
                </fieldset>
              </>
            )}

            {step === 2 && (
              <>
                <BracketHeadline size="h2">{"Lock it in with a\n[password]"}</BracketHeadline>
                <div>
                  <PasswordField
                    label="Password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={fieldErrors.password}
                    autoFocus
                    required
                  />
                  <StrengthMeter level={strength.level} text={strength.text} />
                </div>
              </>
            )}
          </motion.div>

          <Stagger gap={0.05} className="flex flex-col gap-1">
            <Rise>
              <Button
                type="submit"
                variant="ink"
                size="lg"
                fullWidth
                loading={pending}
              >
                {step < 2 ? "Next" : "Join the team"}
              </Button>
            </Rise>
            {step > 0 && !pending && (
              <button
                type="button"
                onClick={() => {
                  setLocalErrors({});
                  setStep((s) => Math.max(0, s - 1));
                }}
                className="min-h-11 text-[14px] font-extrabold text-ink-soft underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
              >
                Back
              </button>
            )}
          </Stagger>
        </form>
      </MotionConfig>

      <Rise>
        <p className="mt-4 text-center text-[15px] font-semibold text-ink-soft">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-extrabold text-lav-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
          >
            Log in
          </Link>
        </p>
      </Rise>

      {handoff && <ShiftLoader ready={false} buddy={buddy} delayMs={500} />}
    </AuthShell>
  );
}
