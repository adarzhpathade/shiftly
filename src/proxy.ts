import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// UI review mode: always show the intro, even when logged in or after it was seen.
const INTRO_ALWAYS = process.env.NEXT_PUBLIC_INTRO_ALWAYS === "1";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // Static assets & internal files
  if (
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next") ||
    pathname === "/icons" ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline" ||
    pathname.startsWith("/offline/") ||
    pathname === "/favicon.ico" ||
    // Public files: only root-level files (e.g. /robots.txt) and the asset folders
    // in public/. A file extension elsewhere (e.g. /admin/x.js) must not skip auth.
    /^\/[^/]+\.(?:ico|png|jpg|jpeg|svg|webp|txt|xml|json)$/.test(pathname) ||
    /^\/(?:3d|images|photos)\/[^/]+\.(?:png|jpg|jpeg|svg|webp)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // /dev/* ONLY when NODE_ENV !== "production"
  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next();
    }
  }

  // Public auth & onboarding landing routes: /welcome, /login, /register, /forgot-password
  const isAuthOrWelcomeRoute =
    pathname === "/welcome" || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  if (isAuthOrWelcomeRoute) {
    if (INTRO_ALWAYS && pathname === "/welcome") {
      return NextResponse.next();
    }
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Everything else requires an active session
  if (!isLoggedIn) {
    const hasSeenIntro = req.cookies.has("seen_intro");
    if (INTRO_ALWAYS || !hasSeenIntro) {
      return NextResponse.redirect(new URL("/welcome", nextUrl));
    }
    const loginUrl = new URL("/login", nextUrl);
    const callbackPath = pathname + (nextUrl.search || "");
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (pathname === "/manager" || pathname.startsWith("/manager/")) {
    if (role !== "MANAGER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
