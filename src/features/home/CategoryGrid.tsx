import { cn } from "@/components/ui/cn";
import { GAME_OBJECT_NAMES, GameObject } from "@/components/ui/GameObject";
import type { GameObjectName } from "@/components/ui/GameObject";
import { SURFACE_CLASS } from "@/components/ui/tones";
import type { Category } from "@/lib/types";
import { SectionHead } from "./SectionHead";

export interface CategoryGridProps {
  categories: readonly Category[];
}

const isObject = (k: string): k is GameObjectName =>
  (GAME_OBJECT_NAMES as readonly string[]).includes(k);

/** 2-up tiles with a floating 3D object bleeding off the corner. */
export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section aria-label="Training categories">
      <SectionHead title="Training" note={`${categories.length} categories`} />
      <div className="grid grid-cols-2 gap-2.5">
        {categories.map((category, i) => {
          const { completedLevels, totalLevels } = category.progress;
          return (
            <a
              key={category.key}
              href="/training"
              className={cn(
                "relative block h-[156px] overflow-hidden rounded-[22px] p-3.5 transition-transform duration-300 ease-spring active:scale-[0.97]",
                SURFACE_CLASS[category.colorToken],
              )}
            >
              <h3 className="relative z-10 text-lg leading-none font-extrabold tracking-[-0.02em]">
                {category.name}
              </h3>
              <small className="absolute bottom-3 left-3.5 z-10 rounded-pill bg-paper/75 px-2 py-[3px] text-[11px] font-bold">
                {completedLevels === 0
                  ? "New"
                  : `${completedLevels} / ${totalLevels}`}
              </small>
              {isObject(category.objectKey) && (
                <GameObject
                  name={category.objectKey}
                  size={104}
                  float
                  floatDelay={-i * 1.3}
                  className="pointer-events-none absolute -right-2.5 -bottom-2"
                />
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
