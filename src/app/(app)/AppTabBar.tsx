"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TabBar, type TabKey } from "@/components/ui/TabBar";

function pathnameToTab(pathname: string): TabKey {
  if (pathname.startsWith("/training")) return "training";
  if (pathname.startsWith("/habits")) return "habits";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export function AppTabBar() {
  const pathname = usePathname();
  const active = pathnameToTab(pathname || "/");

  return (
    <TabBar
      placement="fixed"
      active={active}
      hrefs={{
        home: "/",
        training: "/training",
        habits: "/habits",
        leaderboard: "/leaderboard",
        profile: "/profile",
      }}
      renderLink={({ href, className, label, active: isActive, children }) => (
        <Link
          href={href}
          className={className}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
        >
          {children}
        </Link>
      )}
    />
  );
}
