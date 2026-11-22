"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  ChatBubble,
  ChoiceCard,
  Sticker,
  ThemeColor,
  cn,
} from "@/components/ui";
import type {
  AnswerResult,
  ColorToken,
  GuidedScenario,
  ScenarioResult,
} from "@/lib/types";
import { useCelebrate } from "@/features/celebrations";
import type { CelebrationEvent } from "@/lib/celebrations";
import { ResultScreen } from "./ResultScreen";
import { TONE_BG } from "./tones";

type Fail = { ok: false; error: string };
export type StartFn = (
  scenarioId: string,
) => Promise<{ ok: true; attemptId: string; firstStepId: string } | Fail>;
export type AnswerFn = (
  attemptId: string,
  stepId: string,
  choiceId: string,
) => Promise<{ ok: true; result: AnswerResult } | Fail>;
export type FinishFn = (
  attemptId: string,
) => Promise<{ ok: true; result: ScenarioResult; celebrations?: readonly CelebrationEvent[] } | Fail>;

export type ScenarioPlayerProps = {
  scenario: GuidedScenario;
  categoryName: string;
  colorToken: ColorToken;
  backHref: string;
  replayHref: string;
  nextHref: string | null;
  onStart: StartFn;
  onAnswer: AnswerFn;
  onFinish: FinishFn;
};

type Phase =
  | "loading"
  | "question"
  | "submitting"
  | "feedback"
  | "finishing"
  | "result"
  | "error";

const SPRING = { type: "spring", stiffness: 420, damping: 22 } as const;

const FEEDBACK_TITLE = {
  best: "Best answer",
  okay: "Okay answer",
  poor: "Not quite",
} as const;

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ScenarioPlayer({
  scenario,
  categoryName,
  colorToken,
  backHref,
  nextHref,
  onStart,
  onAnswer,
  onFinish,
}: ScenarioPlayerProps) {
  const celebrate = useCelebrate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [stepId, setStepId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<"start" | "answer" | "finish">("start");
  const startedRef = useRef(false);

  const start = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setPicked(null);
    setAnswer(null);
    setResult(null);
    let res;
    try {
      res = await onStart(scenario.id);
    } catch {
      res = { ok: false as const, error: "Could not start this scenario." };
    }
    if (!res.ok) {
      setFailed("start");
      setError(res.error);
      setPhase("error");
      return;
    }
    setAttemptId(res.attemptId);
    setStepId(res.firstStepId);
    setPhase("question");
  }, [onStart, scenario.id]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  const finish = useCallback(
    async (id: string) => {
      setPhase("finishing");
      let res;
      try {
        res = await onFinish(id);
      } catch {
        res = { ok: false as const, error: "Could not load your result." };
      }
      if (!res.ok) {
        setFailed("finish");
        setError(res.error);
        setPhase("error");
        return;
      }
      setResult(res.result);
      setPhase("result");
      if (res.celebrations?.length) window.setTimeout(() => celebrate(res.celebrations ?? []), 1600);
    },
    [onFinish, celebrate],
  );

  const pick = useCallback(
    async (choiceId: string) => {
      if (!attemptId || !stepId || phase !== "question") return;
      setPicked(choiceId);
      setPhase("submitting");
      let res;
      try {
        res = await onAnswer(attemptId, stepId, choiceId);
      } catch {
        res = { ok: false as const, error: "Could not save your answer." };
      }
      if (!res.ok) {
        setFailed("answer");
        setError(res.error);
        setPhase("error");
        return;
      }
      setAnswer(res.result);
      setPhase("feedback");
    },
    [attemptId, stepId, phase, onAnswer],
  );

  const next = useCallback(() => {
    if (!answer || !attemptId) return;
    if (answer.nextStepId) {
      setStepId(answer.nextStepId);
      setPicked(null);
      setAnswer(null);
      setPhase("question");
    } else {
      void finish(attemptId);
    }
  }, [answer, attemptId, finish]);

  const replay = useCallback(() => {
    startedRef.current = true;
    void start();
  }, [start]);

  const retry = () => {
    if (failed === "start") void start();
    else if (failed === "finish" && attemptId) void finish(attemptId);
    else {
      setPicked(null);
      setError(null);
      setPhase("question");
    }
  };

  const steps = scenario.steps;
  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === stepId),
  );
  const step = steps[stepIndex];
  const lastStep = stepIndex >= steps.length - 1;
  const showResult = phase === "result" && result;
  const done = phase === "finishing" || showResult ? steps.length : stepIndex + (phase === "feedback" ? 1 : 0);

  return (
    <div
      data-category-color={colorToken}
      className={cn(
        "fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden",
        TONE_BG[colorToken],
      )}
    >
      <ThemeColor color={colorToken} />
      <div className="mx-auto flex min-h-full max-w-md flex-col px-gutter pt-5 pb-28">
        {showResult ? (
          <ResultScreen
            result={result}
            nextHref={nextHref}
            backHref={backHref}
            onReplay={replay}
          />
        ) : (
          <>
            <header className="flex items-center gap-2.5">
              <Link
                href={backHref}
                aria-label="Leave scenario"
                className="grid size-10 flex-none place-items-center rounded-full bg-paper"
              >
                <Chevron />
              </Link>
              <div
                role="progressbar"
                aria-label="Scenario progress"
                aria-valuemin={0}
                aria-valuemax={steps.length}
                aria-valuenow={done}
                className="flex flex-1 gap-[5px]"
              >
                {steps.map((s, i) => (
                  <i
                    key={s.id}
                    className={cn(
                      "h-1.5 flex-1 rounded-pill transition-colors duration-500",
                      i < done ? "bg-ink" : "bg-ink/20",
                    )}
                  />
                ))}
              </div>
              <span className="text-[13px] font-bold">
                {Math.min(stepIndex + 1, steps.length)}/{steps.length}
              </span>
            </header>

            <span className="mt-[18px] w-fit rounded-pill bg-paper px-3 py-1 text-xs font-bold">
              {categoryName}
            </span>
            <h1 className="mt-2.5 text-[32px] leading-[0.95] font-extrabold tracking-[-0.035em]">
              {scenario.title}
            </h1>
            <p className="mt-2 text-[13px] leading-[1.35] font-medium text-ink/75">
              {scenario.situation}
            </p>

            {phase === "loading" || phase === "finishing" ? (
              <div
                aria-busy="true"
                aria-label={phase === "loading" ? "Loading scenario" : "Scoring your answers"}
                className="mt-6 flex flex-col gap-3 motion-safe:animate-pulse"
              >
                <div className="h-16 w-4/5 rounded-[6px_22px_22px_22px] bg-paper/70" />
                <div className="mt-4 h-14 rounded-[18px] bg-paper/60" />
                <div className="h-14 rounded-[18px] bg-paper/60" />
                <div className="h-14 rounded-[18px] bg-paper/60" />
                {phase === "finishing" && (
                  <p className="text-center text-sm font-bold">Scoring your answers…</p>
                )}
              </div>
            ) : phase === "error" ? (
              <div role="alert" className="mt-6 rounded-card bg-paper p-5 text-center">
                <Sticker pose="think" size={72} className="mx-auto" />
                <p className="mt-2 text-[15px] font-bold">Something went wrong</p>
                <p className="mt-1 text-[13px] font-medium text-ink-soft">{error}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex min-h-12 items-center justify-center rounded-pill bg-ink px-6 text-[15px] font-bold text-cream"
                  >
                    Try again
                  </button>
                  <Link href={backHref} className="py-2 text-sm font-bold underline">
                    Back to path
                  </Link>
                </div>
              </div>
            ) : !step ? (
              <p className="mt-6 rounded-card bg-paper p-5 text-center text-sm font-medium text-ink-soft">
                This scenario has no steps yet.
              </p>
            ) : (
              <AnimatePresence mode="wait" initial>
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mt-[18px] flex items-center gap-2.5">
                    <Avatar
                      name={scenario.customer.name}
                      avatarKey={scenario.customer.avatarKey}
                      tone="paper"
                    />
                    <div>
                      <b className="block text-sm">{scenario.customer.name}</b>
                      <small className="text-xs font-medium text-ink/70">Customer</small>
                    </div>
                  </div>
                  <ChatBubble className="mt-2.5">{step.customerMessage}</ChatBubble>

                  <p className="mt-5 mb-2.5 text-[13px] font-bold tracking-[0.06em] text-ink/70 uppercase">
                    How do you reply?
                  </p>
                  <ul className="flex flex-col gap-2">
                    {step.choices.map((c, i) => {
                      const isPicked = picked === c.id;
                      const revealed = phase === "feedback" && isPicked && answer;
                      const state = revealed
                        ? answer.rating
                        : isPicked
                          ? "selected"
                          : "idle";
                      const pointsText = answer
                        ? `${FEEDBACK_TITLE[answer.rating]} · +${answer.points}/${answer.maxPoints}`
                        : undefined;
                      return (
                        <motion.li
                          key={c.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{
                            opacity: phase === "feedback" && !isPicked ? 0.45 : 1,
                            y: 0,
                            scale: revealed ? [1, 1.04, 1] : 1,
                          }}
                          transition={{ ...SPRING, scale: { type: "tween", duration: 0.35 }, delay: phase === "question" ? 0.12 + i * 0.07 : 0 }}
                          whileTap={phase === "question" ? { scale: 0.96 } : undefined}
                        >
                          <ChoiceCard
                            choiceKey={String.fromCharCode(65 + i)}
                            state={state}
                            onSelect={phase === "question" ? () => void pick(c.id) : undefined}
                            feedbackTitle={revealed ? pointsText : undefined}
                            feedback={revealed ? answer.feedback : undefined}
                            feedbackAside={
                              revealed ? (
                                <Sticker
                                  pose={answer.rating === "best" ? "cheer" : "think"}
                                  size={56}
                                />
                              ) : undefined
                            }
                          >
                            {c.text}
                          </ChoiceCard>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {phase === "feedback" && (
          <motion.div
            key="cta"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-md px-gutter pb-5"
          >
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-pill bg-ink text-base font-bold text-cream transition-transform active:scale-[0.97]"
            >
              {lastStep ? "See result" : "Continue"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
