import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  /** Inline error text; also marks the input invalid. */
  error?: string;
  /** Helper text shown under the input when there is no error. */
  hint?: ReactNode;
  /** Element placed inside the right edge of the input (e.g. a show/hide toggle). */
  trailing?: ReactNode;
  /** Class for the outer wrapper. */
  wrapperClassName?: string;
};

/** 48px paper-coloured input with label, error text and a visible focus ring. */
export function TextField({
  label,
  error,
  hint,
  trailing,
  id,
  className,
  wrapperClassName,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;
  return (
    <div className={wrapperClassName}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-[13px] font-bold text-ink"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-[16px] border-2 bg-paper px-4 text-[16px] font-semibold text-ink",
            "placeholder:font-medium placeholder:text-ink-soft/70",
            "transition-colors duration-200 focus:outline-none focus-visible:border-lav-ink focus-visible:ring-4 focus-visible:ring-lav/60",
            error ? "border-red" : "border-muted",
            trailing ? "pr-14" : null,
            className,
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1.5 text-[13px] font-bold text-red"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[13px] font-semibold text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
