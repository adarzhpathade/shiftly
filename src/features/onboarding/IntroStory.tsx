"use client";

import { AnimatePresence, MotionConfig, motion, type PanInfo } from "motion/react";
import { Fragment, useState, type ReactNode } from "react";
import {
  BracketHeadline,
  Button,
  GameObject,
  StepDots,
  Sticker,
  Wordmark,
  type HighlightTone,
  type SurfaceTone,
} from "@/components/ui";
import { cn } from "@/components/ui/cn";

type Scene = {
  key: string;
  tone: SurfaceTone;
  headline: string;
  highlight: HighlightTone;
  line: string;
  art: ReactNode;
};

const SCENES: readonly Scene[] = [
  {
    key: "learn",
    tone: "lav",
    headline: "[LEARN]",
    highlight: "paper",
    line: "Practise [real] customer situations. Pick a reply, get instant feedback.",
    art: (
      <>
        <Sticker pose="headset" size={210} className="relative z-10" />
        <GameObject name="bubble" size={96} float className="absolute top-2 right-2" />
        <GameObject name="target" size={72} float floatDelay={-1.6} className="absolute bottom-6 left-0" />
      </>
    ),
  },
  {
    key: "build",
    tone: "lime",
    headline: "[BUILD]",
    highlight: "paper",
    line: "Small daily habits, [big wins]. Check in and keep your streak alive.",
    art: (
      <>
        <GameObject name="flame" size={220} float />
        <GameObject name="calendar" size={84} float floatDelay={-1.2} className="absolute top-4 left-0" />
        <GameObject name="coin" size={64} float floatDelay={-2.4} className="absolute right-2 bottom-8" />
      </>
    ),
  },
  {
    key: "level-up",
    tone: "peach",
    headline: "LEVEL\n[UP]",
    highlight: "paper",
    line: "Earn XP, unlock badges and beat the [boss] in every category.",
    art: (
      <>
        <GameObject name="trophy" size={190} float className="relative z-10" />
        <GameObject name="coin" size={72} float floatDelay={-1.4} className="absolute bottom-6 left-0" />
        <Sticker pose="cheer" size={120} className="absolute right-0 bottom-0 z-20" />
      </>
    ),
  },
];

const BG: Record<SurfaceTone, string> = {
  paper: "bg-paper",
  peach: "bg-peach",
  sky: "bg-sky",
  lav: "bg-lav",
  lime: "bg-lime",
  ink: "bg-ink",
};

function BracketText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((part, i) =>
        /^\[[^\]]+\]$/.test(part) ? (
          <span key={i} className="rounded-md bg-paper px-1.5 py-0.5 text-ink">
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export type IntroStoryProps = {
  /** Called when the last scene's "Get started" is pressed or "Skip" is chosen. */
  onFinish: () => void;
  /** Disables the buttons while the host saves "intro seen". */
  pending?: boolean;
};

/** Three poster scenes: swipe or press Next. Skip is always available. */
export function IntroStory({ onFinish, pending = false }: IntroStoryProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const scene = SCENES[index] ?? SCENES[0]!;
  const last = index === SCENES.length - 1;

  function go(next: number) {
    if (next < 0 || next >= SCENES.length || next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60 || info.velocity.x < -400) {
      go(index + 1);
    } else if (info.offset.x > 60 || info.velocity.x > 400) {
      go(index - 1);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        className={cn(
          "min-h-dvh overflow-hidden transition-colors duration-500",
          BG[scene.tone],
        )}
      >
        <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-gutter pt-4 pb-6">
          <header className="flex items-center justify-between">
            <Wordmark sizeClass="text-[22px]" />
            <button
              type="button"
              onClick={onFinish}
              disabled={pending}
              className="-mr-2 min-h-11 rounded-pill px-3 text-[14px] font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-45"
            >
              Skip
            </button>
          </header>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.section
              key={scene.key}
              aria-label={`Scene ${index + 1} of ${SCENES.length}`}
              custom={direction}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={onDragEnd}
              initial={{ opacity: 0, x: direction * 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -48 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="flex flex-1 flex-col justify-between pt-6"
            >
              <BracketHeadline
                size="poster"
                highlightTone={scene.highlight}
                className="break-words"
              >
                {scene.headline}
              </BracketHeadline>

              <div
                aria-hidden="true"
                className="relative mx-auto my-4 flex min-h-[290px] w-full max-w-[330px] flex-1 items-center justify-center"
              >
                {scene.art}
              </div>

              <p className="text-[19px] leading-snug font-bold">
                <BracketText text={scene.line} />
              </p>
            </motion.section>
          </AnimatePresence>

          <footer className="mt-6 flex flex-col items-center gap-4">
            <StepDots count={SCENES.length} active={index} label={`Scene ${index + 1} of ${SCENES.length}`} />
            <Button
              variant="ink"
              size="lg"
              fullWidth
              disabled={pending}
              onClick={() => (last ? onFinish() : go(index + 1))}
            >
              {last ? "Get started" : "Next"}
            </Button>
          </footer>
        </div>
      </main>
    </MotionConfig>
  );
}
