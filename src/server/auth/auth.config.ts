import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  trustHost: true,
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teamId = user.teamId;
        token.avatarKey = user.avatarKey;
      }
      if (trigger === "update" && session) {
        const newAvatarKey = session.user?.avatarKey ?? session.avatarKey;
        if (newAvatarKey) {
          token.avatarKey = newAvatarKey;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.role) session.user.role = token.role as Role;
        if (token.teamId !== undefined) session.user.teamId = token.teamId as string | null;
        if (token.avatarKey) session.user.avatarKey = token.avatarKey as string;
      }
      return session;
    },
    authorized() {
      return true;
    },
  },
};
