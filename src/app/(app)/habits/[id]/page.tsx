import HabitDetailLoading from "./loading";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { habitRepo } from "@/data";
import { HabitDetailScreen } from "@/features/habits";
import { requireViewer } from "@/server/auth/session";
import { deleteHabitAction } from "@/server/habits-ui/actions";
import type { HabitDetail } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function DetailContent({ params }: PageProps) {
  const { id } = await params;
  const viewer = await requireViewer();
  let habit: HabitDetail;
  try {
    habit = await habitRepo.getDetail(viewer.id, id);
  } catch {
    notFound();
  }
  return <HabitDetailScreen habit={habit} onDelete={deleteHabitAction} />;
}

export default function HabitDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<HabitDetailLoading />}>
      <DetailContent params={params} />
    </Suspense>
  );
}
