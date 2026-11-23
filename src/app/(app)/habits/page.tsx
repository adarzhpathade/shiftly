import HabitsLoading from "./loading";
import { Suspense } from "react";
import { habitRepo } from "@/data";
import { HabitsScreen } from "@/features/habits";
import { requireViewer } from "@/server/auth/session";

async function HabitsContent() {
  const viewer = await requireViewer();
  const overview = await habitRepo.getOverview(viewer.id);
  return <HabitsScreen overview={overview} />;
}

export default function HabitsPage() {
  return (
    <Suspense fallback={<HabitsLoading />}>
      <HabitsContent />
    </Suspense>
  );
}
