import "server-only";
import { redirect } from "next/navigation";
import { registerMockIdentity } from "@/data/mock";
import { auth } from "./index";
import type { Role } from "@/generated/prisma/client";

export interface Viewer {
  id: string;
  name: string;
  role: Role;
  teamId: string | null;
  avatarKey: string;
}

export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const viewer: Viewer = {
    id: session.user.id,
    name: session.user.name ?? "",
    role: session.user.role,
    teamId: session.user.teamId ?? null,
    avatarKey: session.user.avatarKey ?? "buddy-1",
  };
  registerMockIdentity(viewer.id, { name: viewer.name, avatarKey: viewer.avatarKey });
  return viewer;
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }
  return viewer;
}

export async function requireRole(...roles: Role[]): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!roles.includes(viewer.role)) {
    redirect("/");
  }
  return viewer;
}
