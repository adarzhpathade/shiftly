"use client";

import { MotionConfig, motion } from "motion/react";
import { useActionState, useState } from "react";
import {
  AnimatedCheck,
  Avatar,
  BUDDIES,
  BUDDY_KEYS,
  Button,
  Pop,
  Rise,
  RiseHeadline,
  ShakeText,
  Stagger,
  useThemeColor,
  type BuddyKey,
} from "@/components/ui";
import { cn } from "@/components/ui/cn";

export type SetupResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type SetupFlowProps = {
  name: string;
  initialAvatarKey?: string;
  /** Saves the choices. The host navigates away on `{ ok: true }`. */
  onComplete: (input: { avatarKey: string }) => Promise<SetupResult>;
};

function BuddyStep({
  name,
  value,
  onChange,
  error,
  pending,
}: {
  name: string;
  value: BuddyKey;
  onChange: (k: BuddyKey) => void;
  error?: string;
  pending: boolean;
}) {
  const first = name.trim().split(/\s+/)[0] || "you";
  return (
    <Stagger className="flex flex-1 flex-col" gap={0.06}>
      <RiseHeadline size="h1">{"Pick your\n[buddy]"}</RiseHeadline>
      <Rise>
        <p className="mt-2 text-center text-[15px] font-semibold text-ink-soft">
          Hi {first}! Your buddy cheers you on everywhere in shiftly.
        </p>
      </Rise>

      <div
        role="radiogroup"
        aria-label="Choose your buddy"
        className="mt-6 grid grid-cols-3 gap-x-2 gap-y-4"
      >
        {BUDDY_KEYS.map((key, i) => {
          const selected = key === value;
          return (
            <Pop key={key} delay={i * 0.03} className="flex justify-center">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={BUDDIES[key].label}
                onClick={() => onChange(key)}
                className="group flex flex-col items-center gap-1.5 rounded-card p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
              >
                <motion.span
                  initial={false}
                  animate={
                    selected
                      ? { scale: [1, 1.22, 1.06], rotate: [0, -9, 6, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "relative rounded-full",
                    selected
                      ? "ring-4 ring-ink ring-offset-[3px] ring-offset-cream"
                      : "group-active:scale-95",
                  )}
                >
                  <Avatar name={BUDDIES[key].label} avatarKey={key} size="xl" />
                  {selected && (
                    <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-ink text-lime">
                      <AnimatedCheck />
                    </span>
                  )}
                </motion.span>
                <span
                  className={cn(
                    "text-[13px] font-bold",
                    selected ? "text-ink" : "text-ink-soft",
                  )}
                >
                  {BUDDIES[key].label}
                </span>
              </button>
            </Pop>
          );
        })}
      </div>

      {error && (
        <ShakeText
          role="alert"
          className="mt-4 rounded-card bg-paper p-3 text-center text-[14px] font-bold text-red"
        >
          {error}
        </ShakeText>
      )}

      <Rise className="mt-auto pt-8">
        <Button type="submit" variant="ink" size="lg" fullWidth loading={pending}>
          Let&apos;s go
        </Button>
      </Rise>
    </Stagger>
  );
}

/** One-step setup: pick a buddy. Habits are discovered automatically later. */
export function SetupFlow({ name, initialAvatarKey, onComplete }: SetupFlowProps) {
  useThemeColor("cream");
  const [avatarKey, setAvatarKey] = useState<BuddyKey>(
    BUDDY_KEYS.find((k) => k === initialAvatarKey) ?? "buddy-1",
  );

  const [result, submit, pending] = useActionState<SetupResult | null, FormData>(async () => {
    try {
      return await onComplete({ avatarKey });
    } catch {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  }, null);

  const error = result && !result.ok ? (result.fieldErrors?.avatarKey ?? result.error) : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-dvh bg-cream">
        <form
          action={submit}
          className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-gutter pt-5 pb-6"
        >
          <BuddyStep
            name={name}
            value={avatarKey}
            onChange={setAvatarKey}
            error={error}
            pending={pending}
          />
        </form>
      </main>
    </MotionConfig>
  );
}
