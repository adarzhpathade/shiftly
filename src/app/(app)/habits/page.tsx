import { Suspense } from "react";
import { habitRepo } from "@/data";
import { HabitsScreen } from "@/features/habits";
import { requireViewer } from "@/server/auth/session";
import { checkInAction } from "@/server/habits-ui/actions";

async function HabitsContent() {
  const viewer = await requireViewer();
  const habits = await habitRepo.listToday(viewer.id);
  return <HabitsScreen habits={habits} onCheckIn={checkInAction} />;
}

export default function HabitsPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-dvh bg-cream" />}>
      <HabitsContent />
    </Suspense>
  );
}
