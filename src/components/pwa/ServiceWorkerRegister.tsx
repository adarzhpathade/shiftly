"use client";

import { useEffect } from "react";

const ENABLED =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_SW_DEV === "1";

/** Registers /sw.js (production, or dev with NEXT_PUBLIC_SW_DEV=1). Renders nothing. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!ENABLED || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("Service worker registration failed", err));
  }, []);
  return null;
}
