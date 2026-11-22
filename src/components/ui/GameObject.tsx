import Image from "next/image";
import { useId, type CSSProperties } from "react";
import {
  GAME_OBJECT_NAMES,
  OBJECT_ART,
  OBJECT_VIEWBOX,
  type GameObjectName,
} from "@/assets/objects";
import { renderSvgInner } from "@/assets/svg-art";
import { cn } from "./cn";
import { OBJECT_SOURCES, type ObjectSource } from "./game-object-sources";

export { GAME_OBJECT_NAMES };
export type { GameObjectName };

export type GameObjectProps = {
  name: GameObjectName;
  /** Rendered width and height in px. */
  size?: number;
  /** Gentle floating animation (disabled for prefers-reduced-motion). */
  float?: boolean;
  /** Animation offset in seconds, e.g. -1.3, so a row of objects bobs out of sync. */
  floatDelay?: number;
  /** Overrides the registry entry (see game-object-sources.ts). */
  source?: ObjectSource;
  /** Accessible label. Omit for decorative objects. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

export function GameObject({
  name,
  size = 96,
  float = false,
  floatDelay = 0,
  source,
  label,
  className,
  style,
}: GameObjectProps) {
  const scope = useId();
  const src = source ?? OBJECT_SOURCES[name];
  const cls = cn(float && "motion-safe:animate-float", className);
  const st: CSSProperties = {
    ...(float && floatDelay ? { animationDelay: `${floatDelay}s` } : null),
    ...style,
  };

  if (src.kind === "image") {
    return (
      <Image
        src={src.src}
        alt={label ?? ""}
        width={size}
        height={size}
        className={cls}
        style={st}
        aria-hidden={label ? undefined : true}
      />
    );
  }

  return (
    <svg
      viewBox={OBJECT_VIEWBOX}
      width={size}
      height={size}
      className={cls}
      style={st}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{
        __html: renderSvgInner(OBJECT_ART[name], scope),
      }}
    />
  );
}
