import Link from "next/link";
import { GameObject, Pop, Rise, Stagger, cn } from "@/components/ui";
import type { Category, LevelNode } from "@/lib/types";
import { deriveLevelStates, type NodeState } from "./levelState";
import { StarRow } from "./StarRow";
import { TONE_BG, objectFor } from "./tones";

const SIDE = [
  "justify-start",
  "justify-center",
  "justify-end",
  "justify-center",
  "justify-start",
] as const;
const TILT = ["rotate-[14deg]", "-rotate-[14deg]", "-rotate-[14deg]", "rotate-[14deg]"] as const;

const NODE: Record<NodeState, string> = {
  done: "bg-lime text-ink",
  current: "bg-ink text-cream",
  unlocked: "bg-paper text-ink",
  locked: "bg-muted text-ink-soft",
};

function Lock() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={26}
      height={26}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

export function LevelPath({
  category,
  levels,
}: {
  category: Category;
  levels: readonly LevelNode[];
}) {
  const states = deriveLevelStates(levels);
  const base = `/training/${category.key}`;

  return (
    <main className="px-gutter pt-6">
      <Link
        href="/training"
        aria-label="Back to training"
        className="grid size-10 place-items-center rounded-full bg-paper"
      >
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
      </Link>

      <header
        data-category={category.key}
        className={cn(
          "relative mt-4 overflow-hidden rounded-card p-5",
          TONE_BG[category.colorToken],
        )}
      >
        <div className="max-w-[62%]">
          <h1 className="text-[28px] leading-[0.95] font-extrabold tracking-[-0.03em]">
            {category.name}
          </h1>
          <p className="mt-2 text-[12.5px] leading-[1.3] font-medium text-ink/75">
            {category.progress.completedLevels}/{category.progress.totalLevels} levels done
          </p>
        </div>
        <GameObject
          name={objectFor(category.objectKey)}
          size={104}
          float
          className="absolute top-1/2 -right-1 -translate-y-1/2"
        />
      </header>

      {states.length === 0 ? (
        <p className="mt-8 rounded-card bg-paper p-5 text-center text-sm font-medium text-ink-soft">
          No levels here yet.
        </p>
      ) : (
        <Stagger className="mt-6 pb-4" gap={0.1}>
          <ol className="flex flex-col">
            {states.map(({ node, state }, i) => {
              const boss = node.kind === "boss";
              const href = boss ? `${base}/boss` : `${base}/${node.level}`;
              const locked = state === "locked";
              const tag = boss ? "Boss level" : `Level ${node.level}`;
              const body = (
                <>
                  <span
                    className={cn(
                      "relative grid flex-none place-items-center rounded-full text-[30px] font-extrabold",
                      boss ? "size-[104px]" : "size-[84px]",
                      NODE[state],
                      state === "current" && "ring-[6px] ring-lav motion-safe:animate-pulse",
                      boss && !locked && "ring-4 ring-red",
                    )}
                  >
                    {locked ? (
                      <Lock />
                    ) : boss ? (
                      <GameObject name="trophy" size={64} />
                    ) : (
                      node.level
                    )}
                  </span>
                  <span className="min-w-0 rounded-[18px] bg-paper px-3.5 py-2.5 text-left">
                    <span className="block text-[11px] font-bold tracking-[0.06em] text-ink-soft uppercase">
                      {tag}
                      {state === "current" && " · up next"}
                    </span>
                    <span className="block text-[15px] leading-[1.15] font-bold">
                      {node.title}
                    </span>
                    <StarRow stars={node.stars} size={16} className="mt-1" />
                  </span>
                </>
              );
              return (
                <li key={node.level} data-state={state} className="flex flex-col">
                  <Rise className={cn("flex", SIDE[i % SIDE.length])}>
                    {locked ? (
                      <div
                        aria-disabled="true"
                        aria-label={`${tag}: ${node.title}, locked`}
                        className="flex max-w-full items-center gap-3 opacity-70"
                      >
                        {body}
                      </div>
                    ) : (
                      <Link
                        href={href}
                        className="flex max-w-full items-center gap-3 transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lav-ink active:scale-[0.97]"
                      >
                        {body}
                      </Link>
                    )}
                  </Rise>
                  {i < states.length - 1 && (
                    <Pop
                      className={cn(
                        "mx-auto my-1.5 h-10 w-0 border-l-[5px] border-dotted border-ink/25",
                        TILT[i % TILT.length],
                      )}
                    >
                      <span aria-hidden="true" />
                    </Pop>
                  )}
                </li>
              );
            })}
          </ol>
        </Stagger>
      )}
    </main>
  );
}
