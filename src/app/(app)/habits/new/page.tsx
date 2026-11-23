import HabitFormLoading from "./loading";
import { Suspense } from "react";
import { habitRepo } from "@/data";
import { HabitForm } from "@/features/habits";
import { requireViewer } from "@/server/auth/session";
import { saveHabitAction } from "@/server/habits-ui/actions";

async function NewHabitContent() {
  await requireViewer();
  const templates = await habitRepo.listTemplates();
  return (
    <HabitForm
      mode="create"
      templates={templates}
      action={saveHabitAction.bind(null, null)}
      backHref="/habits"
    />
  );
}

export default function NewHabitPage() {
  return (
    <Suspense fallback={<HabitFormLoading />}>
      <NewHabitContent />
    </Suspense>
  );
}
