import { cn } from "@/components/ui";

export function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={filled ? "fill-xp-gold" : "fill-muted"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
    >
      <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8L12 2.8z" />
    </svg>
  );
}

export function StarRow({
  stars,
  max = 3,
  size = 18,
  className,
}: {
  stars: number;
  max?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${stars} of ${max} stars`}
      className={cn("inline-flex gap-0.5 text-ink", className)}
    >
      {Array.from({ length: max }, (_, i) => (
        <StarIcon key={i} filled={i < stars} size={size} />
      ))}
    </span>
  );
}
