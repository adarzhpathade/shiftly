import type { ReactNode } from "react";
import { cn } from "./cn";

export type TabKey = "home" | "training" | "habits" | "leaderboard" | "profile";

const ICONS: Record<TabKey, ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  training: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  habits: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  leaderboard: <path d="M8 21V11h8v10M3 21v-6h5M16 21v-8h5v8M2 21h20" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </>
  ),
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "training", label: "Training" },
  { key: "habits", label: "Habits" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "profile", label: "Profile" },
];

export type TabLinkProps = {
  href: string;
  className: string;
  label: string;
  active: boolean;
  children: ReactNode;
};

export type TabBarProps = {
  active: TabKey;
  /** Called when a tab without an href is pressed. */
  onSelect?: (key: TabKey) => void;
  /** Tabs with an href render as links; others render as buttons. */
  hrefs?: Partial<Record<TabKey, string>>;
  /** Swap in a router link (e.g. next/link) without the kit importing navigation. */
  renderLink?: (props: TabLinkProps) => ReactNode;
  /** `absolute`/`fixed` float the bar near the bottom edge of the container/viewport. */
  placement?: "static" | "absolute" | "fixed";
  className?: string;
};

const PLACEMENT = {
  static: "",
  absolute: "absolute inset-x-3.5 bottom-4 z-30",
  fixed: "fixed inset-x-3.5 bottom-4 z-40 mx-auto max-w-md",
} as const;

export function TabBar({
  active,
  onSelect,
  hrefs,
  renderLink,
  placement = "static",
  className,
}: TabBarProps) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex h-16 items-center justify-around rounded-pill bg-ink px-2",
        PLACEMENT[placement],
        className,
      )}
    >
      {TABS.map(({ key, label }) => {
        const isActive = key === active;
        const cls = cn(
          "grid size-[46px] place-items-center rounded-full transition-transform duration-300 ease-spring active:scale-90",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime",
          isActive ? "bg-lime text-ink" : "text-cream",
        );
        const icon = (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="size-[22px] fill-none stroke-current stroke-[2.2] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            {ICONS[key]}
          </svg>
        );
        const href = hrefs?.[key];
        if (href !== undefined) {
          if (renderLink) {
            return (
              <span key={key} className="contents">
                {renderLink({
                  href,
                  className: cls,
                  label,
                  active: isActive,
                  children: icon,
                })}
              </span>
            );
          }
          return (
            <a
              key={key}
              href={href}
              className={cls}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={onSelect ? () => onSelect(key) : undefined}
            >
              {icon}
            </a>
          );
        }
        return (
          <button
            key={key}
            type="button"
            className={cls}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={onSelect ? () => onSelect(key) : undefined}
          >
            {icon}
          </button>
        );
      })}
    </nav>
  );
}
