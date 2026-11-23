"use client";

import { MotionConfig } from "motion/react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  AnimatedCheck,
  BracketHeadline,
  Button,
  GameObject,
  Rise,
  ShakeText,
  Stagger,
  TextField,
  ThemeColor,
  cn,
} from "@/components/ui";
import { HABIT_ICONS, habitObject } from "@/lib/habit-icons";
import type { HabitInput, HabitTemplate } from "@/lib/types";
import { DAY_LETTERS, DAY_NAMES, toneFor } from "./tones";

export type HabitFormState =
  | null
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

export interface HabitFormProps {
  mode: "create" | "edit";
  /** Only for create: template cards to start from. */
  templates?: readonly HabitTemplate[];
  /** Prefilled values (edit). */
  initial?: HabitInput;
  action: (prev: HabitFormState, formData: FormData) => Promise<HabitFormState>;
  /** Where Cancel goes. */
  backHref: string;
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

export function HabitForm({ mode, templates = [], initial, action, backHref }: HabitFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [days, setDays] = useState<number[]>(initial ? [...initial.daysOfWeek] : ALL_DAYS);
  const [reminder, setReminder] = useState(initial?.reminderTime ?? "");
  const [templateKey, setTemplateKey] = useState<string | null>(null);

  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const formError = state?.ok === false ? state.error : undefined;

  const pickTemplate = (t: HabitTemplate) => {
    setTemplateKey(t.key);
    setTitle(t.title);
    setIcon(t.icon);
    setDays([...t.daysOfWeek]);
    window.setTimeout(
      () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      120,
    );
  };

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );


  return (
    <MotionConfig reducedMotion="user">
      <ThemeColor color="cream" />
      <main className="px-gutter pt-6">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-1 rounded-pill pr-3 text-[14px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back
        </Link>
        <BracketHeadline size="h1" className="mt-1">
          {mode === "create" ? "Add a [habit]" : "Edit [habit]"}
        </BracketHeadline>

        <Stagger className="mt-5 flex flex-col gap-6">
          {mode === "create" && templates.length > 0 && (
            <Rise>
              <section aria-label="Templates">
                <h2 className="mb-2.5 text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">
                  Start from a template
                </h2>
                <ul className="flex flex-col gap-2">
                  {templates.map((t, i) => {
                    const on = templateKey === t.key;
                    return (
                      <li key={t.key}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => pickTemplate(t)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-card bg-paper p-3 text-left ring-[3px] transition-transform duration-300 ease-spring",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink active:scale-[0.98]",
                            on ? "ring-ink" : "ring-transparent",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn("grid size-12 flex-none place-items-center rounded-[16px]", toneFor(i))}
                          >
                            <GameObject name={habitObject(t.icon)} size={34} />
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
                              "grid size-7 flex-none place-items-center rounded-full border-2 transition-colors duration-200",
                              on ? "border-ink bg-ink text-lime" : "border-muted text-transparent",
                            )}
                          >
                            {on && <AnimatedCheck />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-center text-[13px] font-bold text-ink-soft">
                  or make your own below
                </p>
              </section>
            </Rise>
          )}

          <Rise>
            <form
              ref={formRef}
              action={formAction}
              noValidate
              className="flex scroll-mt-4 flex-col gap-5 rounded-card bg-lav/40 p-4"
            >
              <TextField
                label="Habit name"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Greet every customer"
                maxLength={80}
                autoComplete="off"
                error={errors.title}
              />

              <fieldset>
                <legend className="mb-1.5 text-[13px] font-bold">Icon</legend>
                <input type="hidden" name="icon" value={icon} />
                <ul className="grid grid-cols-5 gap-2">
                  {HABIT_ICONS.map((ic, i) => {
                    const on = icon === ic.key;
                    return (
                      <li key={ic.key}>
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={ic.label}
                          onClick={() => setIcon(ic.key)}
                          className={cn(
                            "grid aspect-square w-full place-items-center rounded-[16px] ring-[3px] transition-transform duration-300 ease-spring active:scale-90",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
                            toneFor(i),
                            on ? "scale-105 ring-ink" : "ring-transparent",
                          )}
                        >
                          <GameObject name={ic.object} size={34} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {errors.icon && (
                  <ShakeText role="alert" className="mt-1.5 text-[13px] font-bold text-red">
                    {errors.icon}
                  </ShakeText>
                )}
              </fieldset>

              <fieldset>
                <legend className="mb-1.5 text-[13px] font-bold">Days</legend>
                <ul className="grid grid-cols-7 gap-1.5">
                  {DAY_LETTERS.map((letter, i) => {
                    const d = i + 1;
                    const on = days.includes(d);
                    return (
                      <li key={d}>
                        {on && <input type="hidden" name="days" value={d} />}
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={DAY_NAMES[i]}
                          onClick={() => toggleDay(d)}
                          className={cn(
                            "grid h-11 w-full place-items-center rounded-pill text-[14px] font-extrabold transition-colors duration-200 active:scale-90",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
                            on ? "bg-ink text-cream" : "bg-paper text-ink",
                          )}
                        >
                          {letter}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {errors.days && (
                  <ShakeText role="alert" className="mt-1.5 text-[13px] font-bold text-red">
                    {errors.days}
                  </ShakeText>
                )}
              </fieldset>

              <TextField
                label="Reminder (optional)"
                name="reminderTime"
                type="time"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                error={errors.reminderTime}
                hint="We will nudge you at this time."
              />

              {formError && (
                <ShakeText
                  role="alert"
                  className="rounded-card bg-paper p-3 text-center text-[14px] font-bold text-red"
                >
                  {formError}
                </ShakeText>
              )}

              <div className="flex flex-col gap-2">
                <Button type="submit" variant="ink" size="lg" fullWidth loading={pending}>
                  {mode === "create" ? "Create habit" : "Save changes"}
                </Button>
                <Link
                  href={backHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-pill text-[14px] font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </Rise>
        </Stagger>
      </main>
    </MotionConfig>
  );
}
