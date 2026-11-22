import type { ReactNode } from "react";
import { AppTabBar } from "./AppTabBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-28">
      {children}
      <AppTabBar />
    </div>
  );
}
