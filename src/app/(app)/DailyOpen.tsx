import { getViewer } from "@/server/auth/session";
import { recordDailyOpen } from "@/server/activity/daily-open";

export async function DailyOpen() {
  const viewer = await getViewer();
  if (viewer) {
    void recordDailyOpen(viewer.id).catch((err) => {
      console.error("[activity] Failed to record daily open:", err);
    });
  }
  return null;
}
