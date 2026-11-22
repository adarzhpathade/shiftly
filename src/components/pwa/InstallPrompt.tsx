"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function detectIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && safari;
}

export type InstallPromptState = {
  /** A native install prompt is available (Chromium). */
  canInstall: boolean;
  /** Shows the native prompt. Resolves true if the user accepted. */
  promptInstall: () => Promise<boolean>;
  /** Already running as an installed app. */
  isStandalone: boolean;
  /** iOS Safari, not installed: show the Share, Add to Home Screen hint. */
  showIosHint: boolean;
};

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    // Browser-only detection, done after hydration to avoid mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(detectStandalone());
    setIsIosSafari(detectIosSafari());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  }, [deferred]);

  return {
    canInstall: deferred !== null && !isStandalone,
    promptInstall,
    isStandalone,
    showIosHint: isIosSafari && !isStandalone,
  };
}

/** Install button for the Settings page (UI7). Renders nothing when not applicable. */
export function InstallButton({ className }: { className?: string }) {
  const { canInstall, promptInstall, showIosHint } = useInstallPrompt();

  if (canInstall) {
    return (
      <Button
        variant="lime"
        className={className}
        onClick={() => void promptInstall()}
      >
        Install app
      </Button>
    );
  }
  if (showIosHint) {
    return (
      <p className={className ?? "text-[13px] text-ink-soft"}>
        To install: tap Share, then Add to Home Screen.
      </p>
    );
  }
  return null;
}
