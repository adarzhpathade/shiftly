import HabitDetailLoading from "../loading";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { habitRepo } from "@/data";
import { HabitForm } from "@/features/habits";
import { requireViewer } from "@/server/auth/session";
import { saveHabitAction } from "@/server/habits-ui/actions";
import type { HabitDetail } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditContent({ params }: PageProps) {
  const { id } = await params;
  const viewer = await requireViewer();
  let habit: HabitDetail;
  try {
    habit = await habitRepo.getDetail(viewer.id, id);
  } catch {
    notFound();
  }
  return (
    <HabitForm
      mode="edit"
      initial={{
        title: habit.title,
        icon: habit.icon,
        frequency: habit.frequency,
        daysOfWeek: habit.daysOfWeek,
        reminderTime: habit.reminderTime,
      }}
      action={saveHabitAction.bind(null, id)}
      backHref={`/habits/${id}`}
    />
  );
}

export default function EditHabitPage({ params }: PageProps) {
  return (
    <Suspense fallback={<HabitDetailLoading />}>
      <EditContent params={params} />
    </Suspense>
  );
}
