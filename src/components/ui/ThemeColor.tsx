"use client";

import { useEffect } from "react";
import { THEME_COLORS, type ThemeColorName } from "@/styles/theme-color";

/**
 * Sets the phone browser bar colour (every `meta[name="theme-color"]`, light and dark
 * variants) to a page colour token, and restores the previous values on unmount.
 */
export function useThemeColor(color: ThemeColorName): void {
  useEffect(() => {
    const value = THEME_COLORS[color];
    const metas = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
    );
    const created: HTMLMetaElement[] = [];
    if (metas.length === 0) {
      const m = document.createElement("meta");
      m.name = "theme-color";
      document.head.appendChild(m);
      metas.push(m);
      created.push(m);
    }
    const previous = metas.map((m) => m.content);
    metas.forEach((m) => {
      m.content = value;
    });
    return () => {
      metas.forEach((m, i) => {
        m.content = previous[i] ?? "";
      });
      created.forEach((m) => m.remove());
    };
  }, [color]);
}

/** Component form of `useThemeColor`, for server-rendered pages. Renders nothing. */
export function ThemeColor({ color }: { color: ThemeColorName }) {
  useThemeColor(color);
  return null;
}
