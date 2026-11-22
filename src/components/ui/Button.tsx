import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant = "ink" | "lime" | "paper";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** md and lg keep a 48px+ tap target. `sm` is for pills embedded in cards. */
  size?: ButtonSize;
  fullWidth?: boolean;
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
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill font-extrabold tracking-tight transition-transform duration-300 ease-spring select-none",
        "active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  );
}
