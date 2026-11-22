import type { ReactNode } from "react";
import { cn } from "@/components/ui";

/** 360px phone frame used by the gallery to judge mobile layouts. */
export function PhoneFrame({
  label,
  children,
  tall = false,
  className,
  screenClassName,
  overlay,
}: {
  label: string;
  children: ReactNode;
  /** Fixed 760px height with an internal scroll, like the preview. */
  tall?: boolean;
  className?: string;
  screenClassName?: string;
  /** Absolutely-positioned content (tab bar, CTA) rendered outside the scroller. */
  overlay?: ReactNode;
}) {
  return (
    <figure className="m-0 text-center">
      <figcaption className="mb-2.5 font-bold">{label}</figcaption>
      <div
        className={cn(
          "relative mx-auto w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[44px] border-[10px] border-ink bg-cream text-left shadow-2xl shadow-ink/20",
          tall && "h-[760px]",
          className,
        )}
      >
        <div
          className={cn(
            tall ? "h-full overflow-y-auto px-4 pt-[18px] pb-[110px]" : "p-4",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            screenClassName,
          )}
        >
          {children}
        </div>
        {overlay}
      </div>
    </figure>
  );
}
