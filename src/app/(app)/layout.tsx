import type { ReactNode } from "react";
import { ShiftLoaderHost } from "@/components/ui";
import { CelebrationProvider } from "@/features/celebrations";
import { AppTabBar } from "./AppTabBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CelebrationProvider>
      <div className="pb-28">
        {children}
        <AppTabBar />
        <ShiftLoaderHost />
      </div>
    </CelebrationProvider>
  );
}
