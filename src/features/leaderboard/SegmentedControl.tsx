"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/components/ui";

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  size?: "md" | "sm";
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  const id = useId();
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative flex rounded-pill bg-paper p-1", size === "md" ? "h-12" : "h-10")}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex-1 rounded-pill text-[14px] font-extrabold transition-colors duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
              active ? "text-cream" : "text-ink-soft",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                aria-hidden="true"
                className="absolute inset-0 rounded-pill bg-ink"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
