import { GameObject } from "./GameObject";
import { LoadingDots } from "./LoadingDots";
import { cn } from "./cn";

export type ContextLoaderVariant = "scene" | "call";

export type ContextLoaderProps = {
  variant: ContextLoaderVariant;
  /** Overrides the default text ("Setting the scene…" / "Connecting call…"). */
  label?: string;
  className?: string;
};

const DEFAULT_LABEL: Record<ContextLoaderVariant, string> = {
  scene: "Setting the scene…",
  call: "Connecting call…",
};

/**
 * Small inline loader for a real wait inside a screen. `scene` tumbles a speech bubble,
 * `call` rings and shakes a headset with sound-wave rings. Not full screen: it sits in the
 * page where the content will appear.
 */
export function ContextLoader({ variant, label, className }: ContextLoaderProps) {
  const text = label ?? DEFAULT_LABEL[variant];
  const call = variant === "call";
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("flex flex-col items-center gap-3 rounded-card bg-paper/80 px-6 py-7 text-center", className)}
    >
      <div aria-hidden="true" className="relative grid size-24 place-items-center">
        {call && (
          <>
            <span className="absolute inset-3 rounded-full border-[3px] border-lav-ink/45 motion-safe:animate-ring-wave" />
            <span
              className="absolute inset-3 rounded-full border-[3px] border-lav-ink/45 motion-safe:animate-ring-wave"
              style={{ animationDelay: "0.8s" }}
            />
          </>
        )}
        <div className={cn("relative", call ? "motion-safe:animate-ring" : "motion-safe:animate-tumble")}>
          <GameObject name={call ? "headset" : "bubble"} size={72} />
        </div>
      </div>
      <p className="flex items-center gap-2 text-[15px] font-extrabold">
        <span>{text}</span>
        <LoadingDots dotClass="size-1.5" className="mt-1.5" />
      </p>
    </div>
  );
}
