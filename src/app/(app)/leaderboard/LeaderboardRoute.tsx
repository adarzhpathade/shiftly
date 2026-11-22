"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { LeaderboardScreen, type LeaderboardScreenProps } from "@/features/leaderboard";

type Selection = Pick<LeaderboardScreenProps, "scope" | "period">;

/** Wires the screen to the URL: tabs live in searchParams so the view is shareable. */
export function LeaderboardRoute(props: Omit<LeaderboardScreenProps, "onChange" | "pending">) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic<Selection, Selection>(
    { scope: props.scope, period: props.period },
    (_, next) => next,
  );

  return (
    <LeaderboardScreen
      {...props}
      scope={selected.scope}
      period={selected.period}
      pending={pending}
      onChange={(next) => {
        startTransition(() => {
          setSelected(next);
          router.replace(`${pathname}?scope=${next.scope}&period=${next.period}`, { scroll: false });
        });
      }}
    />
  );
}
