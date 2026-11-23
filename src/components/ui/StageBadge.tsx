import type { GameObjectName } from "@/assets/objects";
import { GameObject } from "./GameObject";
import { cn } from "./cn";

export type StageName = "forming" | "building" | "solid";

const STAGE: Record<StageName, { label: string; object: GameObjectName; pill: string }> = {
  forming: { label: "Forming", object: "sprout", pill: "bg-lime" },
  building: { label: "Building", object: "flame", pill: "bg-peach" },
  solid: { label: "Solid", object: "gem", pill: "bg-sky" },
};

export type StageBadgeProps = {
  stage: StageName;
  /** `sm` fits inside a compact card. */
  size?: "sm" | "md";
  className?: string;
};

/** Habit stage as a soft 3D object (sprout, flame, gem) with a coloured name pill. */
export function StageBadge({ stage, size = "md", className }: StageBadgeProps) {
  const s = STAGE[stage];
  const obj = size === "sm" ? 20 : 26;
  return (
    <span
      data-stage={stage}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-pill py-0.5 pr-2.5 pl-1 font-extrabold tracking-[0.02em] text-ink",
        size === "sm" ? "text-[11px]" : "text-[12px]",
        s.pill,
        className,
      )}
    >
      <GameObject name={s.object} size={obj} />
      {s.label}
    </span>
  );
}

/** Just the stage object, for places that have no room for the pill. */
export function StageObject({
  stage,
  size = 32,
  className,
}: {
  stage: StageName;
  size?: number;
  className?: string;
}) {
  return <GameObject name={STAGE[stage].object} size={size} className={className} />;
}
