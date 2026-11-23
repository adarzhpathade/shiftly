import type { ButtonHTMLAttributes } from "react";
import { LoadingDots } from "./LoadingDots";
import { cn } from "./cn";

export type ButtonVariant = "ink" | "lime" | "paper";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** md and lg keep a 48px+ tap target. `sm` is for pills embedded in cards. */
  size?: ButtonSize;
  fullWidth?: boolean;
  /**
   * Awaiting a server call: the label gives way to three bouncing dots, the button keeps
   * its width (the label stays in place, invisible), is disabled and sets `aria-busy`.
   */
  loading?: boolean;
};

const VARIANT: Record<ButtonVariant, string> = {
  ink: "bg-ink text-cream",
  lime: "bg-lime text-ink",
  paper: "bg-paper text-ink",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-[13px]",
  md: "min-h-12 px-6 text-[15px]",
  lg: "min-h-14 px-8 text-base",
};

export function Button({
  variant = "ink",
  size = "md",
  fullWidth = false,
  type = "button",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative",
        "inline-flex items-center justify-center gap-2 rounded-pill font-extrabold tracking-tight transition-transform duration-300 ease-spring select-none",
        "active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
        loading ? "pointer-events-none" : "disabled:pointer-events-none disabled:opacity-45",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 grid place-items-center">
            <LoadingDots />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
