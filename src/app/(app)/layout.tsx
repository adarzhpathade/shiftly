import type { ReactNode } from "react";
import { CelebrationProvider } from "@/features/celebrations";
import { AppTabBar } from "./AppTabBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CelebrationProvider>
      <div className="pb-28">
        {children}
        <AppTabBar />
      </div>
    </CelebrationProvider>
  );
}
