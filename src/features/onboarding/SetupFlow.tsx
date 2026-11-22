"use client";

import { useActionState, useState } from "react";
import {
  Avatar,
  BUDDIES,
  BUDDY_KEYS,
  BracketHeadline,
  Button,
  StepDots,
  type BuddyKey,
  type SurfaceTone,
} from "@/components/ui";
import { cn } from "@/components/ui/cn";

export type SetupTemplate = {
  key: string;
  title: string;
  icon: string;
  description: string;
  frequency: "daily" | "weekly";
};

export type SetupResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type SetupFlowProps = {
  name: string;
  templates: readonly SetupTemplate[];
  initialAvatarKey?: string;
  /** Saves the choices. The host navigates away on `{ ok: true }`. */
  onComplete: (input: { avatarKey: string; templateIds: string[] }) => Promise<SetupResult>;
};

const MIN = 2;
const MAX = 3;

const ICON_EMOJI: Record<string, string> = {
  clock: "⏰",
  bubble: "💬",
  check: "✅",
  handshake: "🤝",
  phone: "📞",
  book: "📘",
};

const CARD_TONES: SurfaceTone[] = ["peach", "sky", "lav", "lime"];
const CARD_BG: Record<SurfaceTone, string> = {
  paper: "bg-paper",
  peach: "bg-peach",
  sky: "bg-sky",
  lav: "bg-lav",
  lime: "bg-lime",
  ink: "bg-ink",
};

function Check() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuddyStep({
  name,
  value,
  onChange,
  onNext,
}: {
  name: string;
  value: BuddyKey;
  onChange: (k: BuddyKey) => void;
  onNext: () => void;
}) {
  const first = name.trim().split(/\s+/)[0] || "you";
  return (
    <>
      <BracketHeadline size="h1">{"Pick your\n[buddy]"}</BracketHeadline>
      <p className="mt-2 text-[15px] font-semibold text-ink-soft">
        Hi {first}! Your buddy cheers you on everywhere in shiftly.
      </p>

      <div
        role="radiogroup"
        aria-label="Choose your buddy"
        className="mt-6 grid grid-cols-3 gap-x-2 gap-y-4"
      >
        {BUDDY_KEYS.map((key) => {
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={BUDDIES[key].label}
              onClick={() => onChange(key)}
              className="group flex flex-col items-center gap-1.5 rounded-card p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
            >
              <span
                className={cn(
                  "relative rounded-full transition-transform duration-300 ease-spring",
                  selected
                    ? "scale-105 ring-4 ring-ink ring-offset-[3px] ring-offset-cream"
                    : "group-active:scale-95",
                )}
              >
                <Avatar name={BUDDIES[key].label} avatarKey={key} size="xl" />
                {selected && (
                  <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-ink text-lime">
                    <Check />
                  </span>
                )}
              </span>
              <span className={cn("text-[13px] font-bold", selected ? "text-ink" : "text-ink-soft")}>
                {BUDDIES[key].label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <Button variant="ink" size="lg" fullWidth onClick={onNext}>
          Next
        </Button>
      </div>
    </>
  );
}

function HabitsStep({
  templates,
  selected,
  onToggle,
  onBack,
  error,
  pending,
}: {
  templates: readonly SetupTemplate[];
  selected: readonly string[];
  onToggle: (key: string) => void;
  onBack: () => void;
  error?: string;
  pending: boolean;
}) {
  const full = selected.length >= MAX;
  return (
    <>
      <BracketHeadline size="h1">{"Pick [2–3]\nhabits to start"}</BracketHeadline>
      <p className="mt-2 text-[15px] font-semibold text-ink-soft" aria-live="polite">
        {selected.length} of {MAX} picked. You can change them later.
      </p>

      <ul className="mt-5 flex flex-col gap-2.5">
        {templates.map((t, i) => {
          const on = selected.includes(t.key);
          const blocked = full && !on;
          return (
            <li key={t.key}>
              <button
                type="button"
                aria-pressed={on}
                disabled={blocked}
                onClick={() => onToggle(t.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-card bg-paper p-3 text-left ring-[3px] transition-transform duration-300 ease-spring",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
                  "active:scale-[0.98] disabled:opacity-45",
                  on ? "ring-ink" : "ring-transparent",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-12 flex-none place-items-center rounded-[16px] text-2xl",
                    CARD_BG[CARD_TONES[i % CARD_TONES.length] ?? "peach"],
                  )}
                >
                  {ICON_EMOJI[t.icon] ?? "✨"}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[16px] leading-tight font-extrabold tracking-tight">
                    {t.title}
                  </b>
                  <small className="mt-0.5 block text-[13px] leading-snug font-semibold text-ink-soft">
                    {t.description}
                  </small>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-7 flex-none place-items-center rounded-full border-2 transition-colors",
                    on ? "border-ink bg-ink text-lime" : "border-muted text-transparent",
                  )}
                >
                  <Check />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-4 rounded-card bg-paper p-3 text-[14px] font-bold text-red">
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button
          type="submit"
          variant="ink"
          size="lg"
          fullWidth
          disabled={selected.length < MIN || pending}
        >
          {pending ? "Setting up..." : "Let's go"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="min-h-11 rounded-pill text-[14px] font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          Back
        </button>
      </div>
    </>
  );
}

/** Two-step setup: pick a buddy, then pick 2-3 starter habits. */
export function SetupFlow({ name, templates, initialAvatarKey, onComplete }: SetupFlowProps) {
  const [step, setStep] = useState<0 | 1>(0);
  const [avatarKey, setAvatarKey] = useState<BuddyKey>(
    BUDDY_KEYS.find((k) => k === initialAvatarKey) ?? "buddy-1",
  );
  const [selected, setSelected] = useState<string[]>([]);

  const [result, submit, pending] = useActionState<SetupResult | null, FormData>(
    async () => {
      try {
        return await onComplete({ avatarKey, templateIds: selected });
      } catch {
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null,
  );

  function toggle(key: string) {
    setSelected((cur) =>
      cur.includes(key)
        ? cur.filter((k) => k !== key)
        : cur.length >= MAX
          ? cur
          : [...cur, key],
    );
  }

  const error =
    result && !result.ok ? (result.fieldErrors?.templateIds ?? result.error) : undefined;

  return (
    <main className="min-h-dvh bg-cream">
      <form
        action={submit}
        className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-gutter pt-5 pb-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <StepDots count={2} active={step} label={`Step ${step + 1} of 2`} />
          <span className="text-[13px] font-bold text-ink-soft">Step {step + 1} of 2</span>
        </div>
        {step === 0 ? (
          <BuddyStep
            name={name}
            value={avatarKey}
            onChange={setAvatarKey}
            onNext={() => setStep(1)}
          />
        ) : (
          <HabitsStep
            templates={templates}
            selected={selected}
            onToggle={toggle}
            onBack={() => setStep(0)}
            error={error}
            pending={pending}
          />
        )}
      </form>
    </main>
  );
}
