"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import {
  applyBackspace,
  applyInput,
  applyPaste,
  completeCode,
  emptyDigits,
  type DigitsUpdate,
} from "./code-input";
import { cn } from "./cn";

export type CodeInputProps = {
  /** Number of boxes. */
  length?: number;
  /** Called on every change with the digits typed so far; `code` is set once every box is full. */
  onChange?: (digits: string, code: string | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Group label read by screen readers. */
  label?: string;
  /** Id of the element that explains an error, for `aria-describedby`. */
  describedBy?: string;
  autoFocus?: boolean;
  className?: string;
};

/**
 * One-time code as separate digit boxes: auto-advance, backspace steps back, arrow keys move,
 * paste (or an SMS autofill) fills every box. Uncontrolled: change its `key` to clear it.
 */
export function CodeInput({
  length = 6,
  onChange,
  disabled,
  invalid,
  label = "Verification code",
  describedBy,
  autoFocus,
  className,
}: CodeInputProps) {
  const [digits, setDigits] = useState<string[]>(() => emptyDigits(length));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function commit(update: DigitsUpdate) {
    setDigits(update.digits);
    onChange?.(update.digits.join(""), completeCode(update.digits));
    refs.current[update.focus]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Backspace") {
      e.preventDefault();
      commit(applyBackspace(digits, i));
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>, i: number) {
    e.preventDefault();
    commit(applyPaste(digits, i, e.clipboardData.getData("text"), length));
  }

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className={cn("flex justify-between gap-2", className)}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          onChange={(e) => commit(applyInput(digits, i, e.target.value, length))}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={(e) => onPaste(e, i)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 min-w-0 flex-1 rounded-[16px] border-2 bg-paper text-center text-[24px] font-extrabold text-ink",
            "transition-[border-color,transform] duration-200 focus:outline-none focus-visible:border-lav-ink focus-visible:ring-4 focus-visible:ring-lav/60",
            invalid ? "border-red" : d ? "border-ink" : "border-muted",
            d && "scale-[1.04]",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
