import Link from "next/link";
import {
  BracketHeadline,
  GameObject,
  MasteryRing,
  Rise,
  Stagger,
  cn,
} from "@/components/ui";
import type { Category } from "@/lib/types";
import { TONE_BG, objectFor } from "./tones";

export function CategoryList({ categories }: { categories: readonly Category[] }) {
  return (
    <main className="px-gutter pt-8">
      <p className="text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">
        Training mode
      </p>
      <BracketHeadline size="h1" className="mt-1.5">
        {"Pick a [skill]\nto sharpen"}
      </BracketHeadline>

      {categories.length === 0 ? (
        <p className="mt-8 rounded-card bg-paper p-5 text-center text-sm font-medium text-ink-soft">
          No training categories yet. Check back soon.
        </p>
      ) : (
        <Stagger className="mt-6 flex flex-col gap-3.5">
          {categories.map((c) => {
            const started = c.progress.completedLevels > 0;
            const pct = Math.round(c.progress.mastery * 100);
            return (
              <Rise key={c.key}>
                <Link
                  href={`/training/${c.key}`}
                  data-category={c.key}
                  className={cn(
                    "relative block overflow-hidden rounded-card p-4 transition-transform active:scale-[0.98]",
                    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lav-ink",
                    TONE_BG[c.colorToken],
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GameObject
                      name={objectFor(c.objectKey)}
                      size={76}
                      float
                      className="flex-none"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[21px] leading-none font-extrabold tracking-[-0.02em]">
                        {c.name}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.3] font-medium text-ink/75">
                        {c.description}
                      </p>
                    </div>
                    <MasteryRing
                      value={pct}
                      tone="ink"
                      size={56}
                      strokeWidth={7}
                      label={`${c.name} mastery`}
                      className="flex-none"
                    >
                      <span className="text-[12px] font-extrabold">{pct}%</span>
                    </MasteryRing>
                  </div>
                  <div className="mt-3.5 flex items-center justify-between">
                    <span className="rounded-pill bg-paper/70 px-3 py-1 text-xs font-bold">
                      {c.progress.completedLevels}/{c.progress.totalLevels} levels
                    </span>
                    <span className="inline-flex min-h-9 items-center rounded-pill bg-ink px-4 text-[13px] font-bold text-cream">
                      {started ? "Continue" : "Start"}
                    </span>
                  </div>
                </Link>
              </Rise>
            );
          })}
        </Stagger>
      )}
    </main>
  );
}
