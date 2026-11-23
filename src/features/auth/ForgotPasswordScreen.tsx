"use client";

import Link from "next/link";
import { MotionConfig, motion } from "motion/react";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  BracketHeadline,
  Button,
  CodeInput,
  GameObject,
  PeekBuddy,
  Pop,
  Rise,
  ShakeText,
  Stagger,
  StrengthMeter,
  TextField,
  type BuddyKey,
} from "@/components/ui";
import { RESET_CODE_LENGTH, RESET_MIN_PASSWORD_LENGTH } from "@/lib/password-reset";
import type { PasswordResetRequestResult, PasswordResetVerifyResult } from "@/lib/types";
import { AuthShell } from "./AuthShell";
import { PasswordField } from "./PasswordField";
import { passwordStrength } from "./password-strength";
import { CODE_SENT_TEXT, requestNotice, verifyNotice, type ResetNotice } from "./reset-messages";

export type ForgotPasswordScreenProps = {
  /** Step 1: emails the code. */
  onRequestCode: (email: string) => Promise<PasswordResetRequestResult>;
  /** Step 2: checks the code and sets the new password. */
  onReset: (input: { email: string; code: string; newPassword: string }) => Promise<PasswordResetVerifyResult>;
  loginHref: string;
  buddy?: BuddyKey;
};

/** Seconds before "Resend code" works again. */
export const RESEND_COOLDOWN_SECONDS = 30;

type Step = "email" | "code" | "done";

/** A seconds-down counter that starts on demand. */
function useCountdown(): [number, (seconds: number) => void] {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);
  return [left, setLeft];
}

/** The mailbox that swallows a letter while the code is on its way. */
function SendingMailbox() {
  return (
    <MotionConfig reducedMotion="user">
      <div role="img" aria-label="Sending your code" className="relative size-[150px]">
        <GameObject name="mailbox" size={132} className="absolute bottom-0 left-[10px]" />
        <motion.svg
          viewBox="0 0 40 28"
          aria-hidden="true"
          className="absolute top-1 left-1 w-11 overflow-visible"
          initial={{ x: -10, y: 0, rotate: -12, opacity: 0 }}
          animate={{
            x: [-10, 28, 58, 58],
            y: [0, 22, 40, 40],
            rotate: [-12, 4, 0, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.4, 0.8, 1] }}
        >
          <rect x="1.5" y="1.5" width="37" height="25" rx="4" className="fill-paper stroke-ink" strokeWidth="2.5" />
          <path d="M3 4l17 13L37 4" fill="none" className="stroke-ink" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </div>
    </MotionConfig>
  );
}

export function ForgotPasswordScreen({
  onRequestCode,
  onReset,
  loginHref,
  buddy = "buddy-1",
}: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [emailNotice, setEmailNotice] = useState<ResetNotice | null>(null);
  const [codeNotice, setCodeNotice] = useState<ResetNotice | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<ResetNotice | null>(null);
  const [generalNotice, setGeneralNotice] = useState<ResetNotice | null>(null);
  const [info, setInfo] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [codeKey, setCodeKey] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [resendLeft, setResendLeft] = useCountdown();
  const [lockLeft, setLockLeft] = useCountdown();
  const codeNoticeId = useId();
  const [needsNewCode, setNeedsNewCode] = useState(false);

  const strength = passwordStrength(newPassword);

  function clearNotices() {
    setEmailNotice(null);
    setCodeNotice(null);
    setPasswordNotice(null);
    setGeneralNotice(null);
    setInfo("");
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    clearNotices();
    setSending(true);
    try {
      const res = await onRequestCode(email);
      const notice = requestNotice(res);
      if (notice) {
        setEmailNotice(notice);
        if (notice.next === "wait" && notice.retryAfterSeconds) setResendLeft(notice.retryAfterSeconds);
        return;
      }
      setStep("code");
      setResendLeft(RESEND_COOLDOWN_SECONDS);
      setInfo(CODE_SENT_TEXT);
    } catch {
      setEmailNotice({ text: "Something went wrong. Please try again.", next: "fix" });
    } finally {
      setSending(false);
    }
  }

  async function resend() {
    if (resending || resendLeft > 0) return;
    clearNotices();
    setResending(true);
    try {
      const res = await onRequestCode(email);
      const notice = requestNotice(res);
      if (notice) {
        if (notice.field === "email") {
          setEmailNotice(notice);
          setStep("email");
        } else {
          setGeneralNotice(notice);
          if (notice.retryAfterSeconds) setResendLeft(notice.retryAfterSeconds);
        }
        return;
      }
      setNeedsNewCode(false);
      setCodeKey((k) => k + 1);
      setCode(null);
      setResendLeft(RESEND_COOLDOWN_SECONDS);
      setInfo("New code sent. The old one no longer works.");
    } catch {
      setGeneralNotice({ text: "Something went wrong. Please try again.", next: "fix" });
    } finally {
      setResending(false);
    }
  }

  async function submitReset(e: FormEvent) {
    e.preventDefault();
    if (resetting || lockLeft > 0) return;
    clearNotices();
    if (!code) {
      setCodeNotice({ text: `Enter all ${RESET_CODE_LENGTH} digits of the code.`, field: "code", next: "fix" });
      return;
    }
    if (newPassword.length < RESET_MIN_PASSWORD_LENGTH) {
      setPasswordNotice({
        text: `Use at least ${RESET_MIN_PASSWORD_LENGTH} characters.`,
        field: "newPassword",
        next: "fix",
      });
      return;
    }
    setResetting(true);
    try {
      const res = await onReset({ email, code, newPassword });
      const notice = verifyNotice(res);
      if (!notice) {
        setStep("done");
        return;
      }
      if (notice.field === "email") {
        setEmailNotice(notice);
        setStep("email");
      } else if (notice.field === "newPassword") {
        setPasswordNotice(notice);
      } else if (notice.field === "code") {
        setCodeNotice(notice);
        if (notice.next === "resend") {
          setNeedsNewCode(true);
          setCodeKey((k) => k + 1);
          setCode(null);
          setResendLeft(0);
        }
      } else {
        setGeneralNotice(notice);
        if (notice.retryAfterSeconds) setLockLeft(Math.min(notice.retryAfterSeconds, 3600));
      }
    } catch {
      setGeneralNotice({ text: "Something went wrong. Please try again.", next: "fix" });
    } finally {
      setResetting(false);
    }
  }

  if (step === "done") {
    return (
      <AuthShell>
        <Pop wiggle className="relative mt-8 flex justify-center">
          <GameObject name="sparkle" size={46} float className="absolute top-2 left-[14%]" />
          <GameObject name="sparkle" size={34} float floatDelay={-1.4} className="absolute top-12 right-[16%]" />
          <PeekBuddy buddy={buddy} pose="cheer" size={150} />
        </Pop>
        <Rise>
          <BracketHeadline size="h1" className="mt-3 text-center">
            {"Password\n[reset]"}
          </BracketHeadline>
        </Rise>
        <Rise>
          <p role="status" className="mt-2 text-center text-[15px] font-semibold text-ink-soft">
            All set. Log in with your new password.
          </p>
        </Rise>
        <Rise className="mt-7">
          <Link
            href={loginHref}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-pill bg-ink px-8 text-base font-extrabold tracking-tight text-cream transition-transform duration-300 ease-spring select-none active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
          >
            Back to log in
          </Link>
        </Rise>
      </AuthShell>
    );
  }

  if (step === "email") {
    return (
      <AuthShell>
        <Pop wiggle={!sending} className="mt-5 flex justify-center">
          {sending ? (
            <SendingMailbox />
          ) : (
            <PeekBuddy buddy={buddy} pose="key" size={140} label="Your buddy holding a lost key" />
          )}
        </Pop>
        <Rise>
          <BracketHeadline size="h1" className="mt-1 text-center">
            {"Lost your\n[password]?"}
          </BracketHeadline>
        </Rise>
        <Rise>
          <p className="mt-2 text-center text-[15px] font-semibold text-ink-soft">
            No stress. Tell us your email and we will send a {RESET_CODE_LENGTH}-digit code.
          </p>
        </Rise>
        <form onSubmit={sendCode} noValidate className="mt-6 flex flex-col gap-4">
          <div aria-live="polite">
            {emailNotice && !emailNotice.field && (
              <ShakeText role="alert" className="rounded-card bg-paper p-3 text-center text-[14px] font-bold text-red">
                {emailNotice.text}
              </ShakeText>
            )}
          </div>
          <Rise>
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
              error={emailNotice?.field === "email" ? emailNotice.text : undefined}
              required
            />
          </Rise>
          <Rise>
            <Button type="submit" variant="ink" size="lg" fullWidth loading={sending} disabled={resendLeft > 0 && !!emailNotice}>
              Send code
            </Button>
          </Rise>
        </form>
        <Rise>
          <p className="mt-5 text-center text-[15px] font-semibold text-ink-soft">
            Remembered it?{" "}
            <Link
              href={loginHref}
              className="font-extrabold text-lav-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
            >
              Back to log in
            </Link>
          </p>
        </Rise>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Pop className="mt-4 flex justify-center">
        <GameObject name="mailbox" size={92} float />
      </Pop>
      <Rise>
        <BracketHeadline size="h1" className="mt-1 text-center">
          {"Check your\n[inbox]"}
        </BracketHeadline>
      </Rise>
      <Rise>
        <p role="status" className="mt-2 text-center text-[15px] font-semibold text-ink-soft">
          {info || CODE_SENT_TEXT}
        </p>
      </Rise>

      <Stagger className="mt-6 flex flex-col gap-4" gap={0.06}>
        <form onSubmit={submitReset} noValidate className="flex flex-col gap-4">
          <div aria-live="polite">
            {generalNotice && (
              <ShakeText role="alert" className="rounded-card bg-paper p-3 text-center text-[14px] font-bold text-red">
                {generalNotice.text}
              </ShakeText>
            )}
          </div>

          <Rise>
            <p className="mb-1.5 text-[13px] font-bold">Code from your email</p>
            <CodeInput
              key={codeKey}
              length={RESET_CODE_LENGTH}
              label={`${RESET_CODE_LENGTH}-digit code`}
              invalid={codeNotice?.field === "code"}
              describedBy={codeNotice ? codeNoticeId : undefined}
              autoFocus
              disabled={resetting}
              onChange={(_digits, complete) => {
                setCode(complete);
                if (codeNotice?.next === "fix") setCodeNotice(null);
              }}
            />
            <div id={codeNoticeId} aria-live="polite">
              {codeNotice && (
                <ShakeText role="alert" className="mt-1.5 text-[13px] font-bold text-red">
                  {codeNotice.text}
                </ShakeText>
              )}
            </div>
          </Rise>

          <Rise>
            <PasswordField
              label="New password"
              name="newPassword"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={passwordNotice?.text}
              required
            />
            <StrengthMeter level={strength.level} text={strength.text} />
          </Rise>

          <Rise>
            <Button
              type="submit"
              variant="ink"
              size="lg"
              fullWidth
              loading={resetting}
              disabled={lockLeft > 0}
            >
              {lockLeft > 0 ? "Please wait a moment" : "Reset password"}
            </Button>
          </Rise>
        </form>

        <Rise className="flex flex-col items-center gap-1">
          <Button
            variant={needsNewCode ? "lime" : "paper"}
            size="sm"
            loading={resending}
            disabled={resendLeft > 0}
            onClick={resend}
          >
            {resendLeft > 0 ? `Resend code in ${resendLeft}s` : "Resend code"}
          </Button>
          <button
            type="button"
            onClick={() => {
              clearNotices();
              setStep("email");
            }}
            className="min-h-10 px-3 text-[14px] font-extrabold text-lav-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
          >
            Use a different email
          </button>
        </Rise>
      </Stagger>
    </AuthShell>
  );
}
