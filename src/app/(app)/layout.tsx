import { Suspense, type ReactNode } from "react";
import { ShiftLoaderHost } from "@/components/ui";
import { CelebrationProvider } from "@/features/celebrations";
import { AppTabBar } from "./AppTabBar";
import { DailyOpen } from "./DailyOpen";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CelebrationProvider>
      <div className="pb-28">
        <Suspense fallback={null}>
          <DailyOpen />
        </Suspense>
        {children}
        <AppTabBar />
        <ShiftLoaderHost />
      </div>
    </CelebrationProvider>
  );
}
