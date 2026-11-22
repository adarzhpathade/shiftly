import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig as edgeConfig } from "./auth.config";
import { db } from "@/server/db";
import { verifyCredentials } from "./core";
import { loginSchema } from "./validation";

export const authConfig: NextAuthConfig = {
  ...edgeConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const user = await verifyCredentials(db, parsed.data.email, parsed.data.password);
        if (!user) {
          return null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
          avatarKey: user.avatarKey,
        };
      },
    }),
  ],
};
