"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
  type Variants,
} from "motion/react";
import { Fragment, useState, type ReactNode } from "react";
import {
  Button,
  Drop,
  GameObject,
  Pop,
  Rise,
  RiseHeadline,
  Stagger,
  StepDots,
  useThemeColor,
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
  /** Layers of the art. Each layer drifts by its own depth while dragging. */
  art: (x: MotionValue<number>) => ReactNode;
};

/** Wraps a layer so it drifts against the drag (parallax). */
function Layer({
  x,
  depth,
  className,
  children,
}: {
  x: MotionValue<number>;
  depth: number;
  className?: string;
  children: ReactNode;
}) {
  const shift = useTransform(x, (v) => v * depth);
  return (
    <motion.div style={{ x: shift }} className={className}>
      {children}
    </motion.div>
  );
}

const SCENES: readonly Scene[] = [
  {
    key: "learn",
    tone: "lav",
    headline: "[LEARN]",
    highlight: "paper",
    line: "Practise [real] customer situations. Pick a reply, get instant feedback.",
    art: (x) => (
      <>
        <Layer x={x} depth={-0.15} className="relative z-10">
          <Drop delay={0.1}>
            <Sticker pose="headset" size={210} />
          </Drop>
        </Layer>
        <Layer x={x} depth={-0.4} className="absolute top-2 right-2">
          <Pop delay={0.55} wiggle>
            <GameObject name="bubble" size={96} float />
          </Pop>
        </Layer>
        <Layer x={x} depth={0.3} className="absolute bottom-6 left-0">
          <Pop delay={0.7} wiggle>
            <GameObject name="target" size={72} float floatDelay={-1.6} />
          </Pop>
        </Layer>
      </>
    ),
  },
  {
    key: "build",
    tone: "lime",
    headline: "[BUILD]",
    highlight: "paper",
    line: "Small daily habits, [big wins]. Check in and keep your streak alive.",
    art: (x) => (
      <>
        <Layer x={x} depth={-0.15}>
          <Drop delay={0.1}>
            <GameObject name="flame" size={220} float />
          </Drop>
        </Layer>
        <Layer x={x} depth={-0.4} className="absolute top-4 left-0">
          <Pop delay={0.55} wiggle>
            <GameObject name="calendar" size={84} float floatDelay={-1.2} />
          </Pop>
        </Layer>
        <Layer x={x} depth={0.3} className="absolute right-2 bottom-8">
          <Pop delay={0.7} wiggle>
            <GameObject name="coin" size={64} float floatDelay={-2.4} />
          </Pop>
        </Layer>
      </>
    ),
  },
  {
    key: "level-up",
    tone: "peach",
    headline: "LEVEL\n[UP]",
    highlight: "paper",
    line: "Earn XP, unlock badges and beat the [boss] in every category.",
    art: (x) => (
      <>
        <Layer x={x} depth={-0.15} className="relative z-10">
          <Drop delay={0.1}>
            <GameObject name="trophy" size={190} float />
          </Drop>
        </Layer>
        <Layer x={x} depth={0.35} className="absolute bottom-6 left-0">
          <Pop delay={0.55} wiggle>
            <GameObject name="coin" size={72} float floatDelay={-1.4} />
          </Pop>
        </Layer>
        <Layer x={x} depth={-0.45} className="absolute right-0 bottom-0 z-20">
          <Pop delay={0.75} wiggle>
            <Sticker pose="cheer" size={120} />
          </Pop>
        </Layer>
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

const SLIDE = 64;

const SCENE_VARIANTS: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * SLIDE }),
  center: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 340, damping: 30 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -SLIDE,
    transition: { duration: 0.16, ease: "easeIn" },
  }),
};

/** One scene: draggable, with a staggered entrance and parallax art. */
function SceneView({
  scene,
  index,
  total,
  direction,
  onSwipe,
}: {
  scene: Scene;
  index: number;
  total: number;
  direction: number;
  onSwipe: (delta: 1 | -1) => void;
}) {
  const x = useMotionValue(0);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60 || info.velocity.x < -400) onSwipe(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) onSwipe(-1);
  }

  return (
    <motion.section
      aria-label={`Scene ${index + 1} of ${total}`}
      custom={direction}
      variants={SCENE_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ x }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      onDragEnd={onDragEnd}
      className="flex flex-1 touch-pan-y flex-col pt-6"
    >
      <Stagger
        className="flex flex-1 flex-col justify-between"
        gap={0.07}
        delay={0.02}
      >
        <RiseHeadline
          size="poster"
          by="letters"
          highlightTone={scene.highlight}
          className="break-words"
        >
          {scene.headline}
        </RiseHeadline>

        <div
          aria-hidden="true"
          className="relative mx-auto my-4 flex min-h-[290px] w-full max-w-[330px] flex-1 items-center justify-center"
        >
          <motion.div
            className="absolute inset-x-2 inset-y-6 rounded-[48px] bg-paper/35"
            initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: -3, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 190,
              damping: 17,
              delay: 0.1,
            }}
          />
          {scene.art(x)}
        </div>

        <Rise delay={0.35}>
          <p className="text-center text-[19px] leading-snug font-bold">
            <BracketText text={scene.line} />
          </p>
        </Rise>
      </Stagger>
    </motion.section>
  );
}

/** Three poster scenes: swipe or press Next. Skip is always available. */
export function IntroStory({ onFinish, pending = false }: IntroStoryProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const scene = SCENES[index] ?? SCENES[0]!;
  const last = index === SCENES.length - 1;
  useThemeColor(scene.tone);

  function go(next: number) {
    if (next < 0 || next >= SCENES.length || next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
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

          <AnimatePresence mode="wait" custom={direction}>
            <SceneView
              key={scene.key}
              scene={scene}
              index={index}
              total={SCENES.length}
              direction={direction}
              onSwipe={(d) => go(index + d)}
            />
          </AnimatePresence>

          <footer className="mt-6 flex flex-col items-center gap-4">
            <StepDots
              count={SCENES.length}
              active={index}
              label={`Scene ${index + 1} of ${SCENES.length}`}
            />
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 28, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 340,
                damping: 18,
                delay: 0.5,
              }}
            >
              <Button
                variant="ink"
                size="lg"
                fullWidth
                disabled={pending}
                loading={pending && last}
                onClick={() => (last ? onFinish() : go(index + 1))}
              >
                {last ? "Get started" : "Next"}
              </Button>
            </motion.div>
          </footer>
        </div>
      </main>
    </MotionConfig>
  );
}
