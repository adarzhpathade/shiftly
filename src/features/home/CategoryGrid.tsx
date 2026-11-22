import { Card } from "@/components/ui/Card";
import { GAME_OBJECT_NAMES, GameObject } from "@/components/ui/GameObject";
import type { GameObjectName } from "@/components/ui/GameObject";
import { MasteryRing } from "@/components/ui/MasteryRing";
import type { Category } from "@/lib/types";

export interface CategoryGridProps {
  categories: readonly Category[];
}

const isObject = (k: string): k is GameObjectName =>
  (GAME_OBJECT_NAMES as readonly string[]).includes(k);

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section aria-labelledby="categories-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="categories-heading" className="text-lg font-extrabold">
          Categories
        </h2>
        <a href="/training" className="text-sm font-bold underline">
          View all training
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category, i) => (
          <article key={category.key}>
            <a
              href="/training"
              className="block transition-transform duration-300 ease-spring active:scale-[0.97]"
            >
              <Card
                tone={category.colorToken}
                className="flex min-h-36 flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-1">
                  <h3 className="max-w-[70%] text-[15px] leading-tight font-extrabold">
                    {category.name}
                  </h3>
                  {isObject(category.objectKey) && (
                    <GameObject
                      name={category.objectKey}
                      size={44}
                      float
                      floatDelay={-i * 0.9}
                    />
                  )}
                </div>
                <MasteryRing
                  value={Math.round(category.progress.mastery * 100)}
                  label={`${category.name} mastery`}
                  size={64}
                  tone="ink"
                />
              </Card>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
