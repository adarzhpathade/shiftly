import { ComingSoon } from "@/features/home/ComingSoon";
import { logoutAction } from "@/server/auth/actions";

export default function ProfilePage() {
  return (
    <ComingSoon title="Profile">
      <form action={logoutAction}>
        <button type="submit" className="mt-2 inline-flex min-h-11 items-center rounded-pill bg-ink px-6 text-sm font-bold text-cream">Log out</button>
      </form>
    </ComingSoon>
  );
}
