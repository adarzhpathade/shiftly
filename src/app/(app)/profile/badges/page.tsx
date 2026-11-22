import { Suspense } from "react";
import { BadgesScreen } from "@/features/profile";
import { requireViewer } from "@/server/auth/session";
import { loadProfileView } from "@/server/profile/load";
import ProfileLoading from "../loading";

async function BadgesContent() {
  const viewer = await requireViewer();
  const view = await loadProfileView(viewer.id);
  return <BadgesScreen badges={view.badges} />;
}

export default function BadgesPage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <BadgesContent />
    </Suspense>
  );
}
