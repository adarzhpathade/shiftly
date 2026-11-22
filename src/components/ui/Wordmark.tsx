import { cn } from "./cn";

export type WordmarkProps = {
  className?: string;
  /** Text size class, default matches the preview header. */
  sizeClass?: string;
};

/** "shiftly" wordmark with the star mark, as in the style-preview header. */
export function Wordmark({ className, sizeClass = "text-[26px]" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-extrabold tracking-[-0.04em]",
        sizeClass,
        className,
      )}
    >
      shiftly
      <svg viewBox="0 0 24 24" aria-hidden="true" className="mb-[0.4em] size-[0.7em] fill-ink">
        <path d="M12 1l2.2 6.2L20.5 5l-3.7 5.4L23 12l-6.2 1.6 3.7 5.4-6.3-2.2L12 23l-2.2-6.2L3.5 19l3.7-5.4L1 12l6.2-1.6L3.5 5l6.3 2.2z" />
      </svg>
    </span>
  );
}
