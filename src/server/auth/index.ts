import NextAuth from "next-auth";
import { authConfig } from "./config";

export const { auth, signIn, signOut, handlers, unstable_update } = NextAuth(authConfig);
