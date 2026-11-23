"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BracketHeadline,
  Button,
  GameObject,
  PeekBuddy,
  Rise,
  ShakeText,
  Stagger,
  TextField,
  ThemeColor,
  Wordmark,
  type BuddyKey,
} from "@/components/ui";
import { PasswordField } from "./PasswordField";
import type { DemoAccount, FormResult } from "./types";

export type LoginScreenProps = {
  /** Checks the credentials. Must NOT navigate: the screen calls `onSuccess` after the thumbs-up. */
  onSubmit: (input: { email: string; password: string }) => Promise<FormResult>;
  /** Navigates on after a successful login (called just after the buddy's thumbs-up). */
  onSuccess?: () => void;
  registerHref: string;
  forgotHref: string;
  /** The buddy to show. Defaults to Sunny. */
  buddy?: BuddyKey;
  /** Shown as tap-to-fill helpers (demo mode only). */
  demoAccounts?: readonly DemoAccount[];
};

/** How long the thumbs-up shows before the redirect. */
export const THUMBS_UP_MS = 850;
/** How long the shrug lasts after a wrong password. */
const SHRUG_MS = 2600;

export function LoginScreen({
  onSubmit,
  onSuccess,
  registerHref,
  forgotHref,
  buddy = "buddy-1",
  demoAccounts,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<FormResult | null>(null);
  const [typingPassword, setTypingPassword] = useState(false);
  const [shrugging, setShrugging] = useState(false);
  const [success, setSuccess] = useState(false);
  const [wobbleKey, setWobbleKey] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setResult(null);
    let res: FormResult;
    try {
      res = await onSubmit({ email, password });
    } catch {
      res = { ok: false, error: "Something went wrong. Please try again." };
    }
    setResult(res);
    if (res.ok) {
      // Stay "pending" until the redirect lands, so the button never springs back.
      setSuccess(true);
      timers.current.push(window.setTimeout(() => onSuccess?.(), THUMBS_UP_MS));
      return;
    }
    setPending(false);
    setShrugging(true);
    setWobbleKey((k) => k + 1);
    timers.current.push(window.setTimeout(() => setShrugging(false), SHRUG_MS));
  }

  const failed = result && !result.ok ? result : null;
  const fieldErrors = failed?.fieldErrors ?? {};
  const pose = success ? "thumbs" : typingPassword ? "cover" : shrugging ? "shrug" : "sign";

  return (
    <main className="min-h-dvh bg-cream">
      <ThemeColor color="lime" />
      <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col">
        <div className="relative rounded-b-[44px] bg-lime px-gutter pt-5 pb-[72px]">
          <Wordmark sizeClass="text-[22px]" />
          <div className="relative mt-3 flex items-end justify-between">
            <BracketHeadline size="h1" highlightTone="paper" className="relative z-10 pb-4">
              {"Clock in\nto your\n[shift]"}
            </BracketHeadline>
            <GameObject
              name="headset"
              size={104}
              float
              className="absolute top-0 left-[38%] z-0 -rotate-12"
            />
            <div className="relative z-10 -mr-1">
              <PeekBuddy
                buddy={buddy}
                pose={pose}
                sign="[welcome back]"
                size={156}
                wobble={pose === "shrug"}
                wobbleKey={wobbleKey}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 -mt-[84px] flex-1 px-gutter pb-8">
          <Stagger gap={0.07} delay={0.1}>
            <Rise>
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Log in"
              className="flex flex-col gap-4 rounded-[28px] bg-paper p-5 shadow-lg shadow-ink/15"
            >
              <div aria-live="assertive">
                {failed &&
                  (!failed.fieldErrors || Object.keys(fieldErrors).length === 0) && (
                    <ShakeText
                      role="alert"
                      className="rounded-[14px] bg-cream p-3 text-center text-[14px] font-bold text-red"
                    >
                      {failed.error}
                    </ShakeText>
                  )}
              </div>

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
                wrapperClassName="[&_input]:bg-cream"
                required
              />
              <div>
                <PasswordField
                  label="Password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    setTypingPassword(true);
                    setShrugging(false);
                  }}
                  onBlur={() => setTypingPassword(false)}
                  error={fieldErrors.password}
                  wrapperClassName="[&_input]:bg-cream"
                  required
                />
                <div className="mt-2 flex justify-end">
                  <Link
                    href={forgotHref}
                    className="inline-flex min-h-9 items-center text-[14px] font-extrabold text-lav-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" variant="ink" size="lg" fullWidth loading={pending}>
                Clock in
              </Button>
            </form>
            </Rise>

            <Rise>
              <p className="mt-5 text-center text-[15px] font-semibold text-ink-soft">
                New here?{" "}
                <Link
                  href={registerHref}
                  className="font-extrabold text-lav-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
                >
                  Create an account
                </Link>
              </p>
            </Rise>

            {demoAccounts && demoAccounts.length > 0 && (
              <Rise>
                <section
                  aria-label="Demo login"
                  className="mt-6 rounded-card border-2 border-dashed border-ink/25 p-3"
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
                    Tap one to fill the form, then press Clock in.
                  </p>
                </section>
              </Rise>
            )}
          </Stagger>
        </div>
      </div>
    </main>
  );
}
