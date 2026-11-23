import { cn } from "./cn";

export type LoadingDotsProps = {
  /** Dot size class, default `size-2`. */
  dotClass?: string;
  className?: string;
};

/**
 * Three bouncing dots in the current text colour. Reduced motion gets a soft fade instead
 * of a bounce. Decorative: the parent carries the accessible label.
 */
export function LoadingDots({ dotClass = "size-2", className }: LoadingDotsProps) {
  return (
    <span aria-hidden="true" className={cn("inline-flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-current motion-safe:animate-dot motion-reduce:animate-dot-fade",
            dotClass,
          )}
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );
}
