import { Suspense } from "react";
import { ProfileScreen } from "@/features/profile";
import { logoutAction } from "@/server/auth/actions";
import { requireViewer } from "@/server/auth/session";
import { saveBuddyAction } from "@/server/profile/actions";
import { loadProfileView } from "@/server/profile/load";
import ProfileLoading from "./loading";

async function ProfileContent() {
  const viewer = await requireViewer();
  const view = await loadProfileView(viewer.id);
  return (
    <ProfileScreen
      profile={{ ...view.profile, name: viewer.name || view.profile.name, avatarKey: viewer.avatarKey }}
      badges={view.badges}
      quests={view.quests}
      onSaveBuddy={saveBuddyAction}
      logout={
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-pill bg-ink px-6 text-sm font-bold text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
          >
            Log out
          </button>
        </form>
      }
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
}
