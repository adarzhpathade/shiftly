import HabitsLoading from "./loading";
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
    <Suspense fallback={<HabitsLoading />}>
      <HabitsContent />
    </Suspense>
  );
}
