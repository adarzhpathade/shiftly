/** Cream, for the browser theme-color meta tag (must be a literal colour). */
export const THEME_COLOR_CREAM = "#f2ece3";

/**
 * Literal colours for the browser bar (theme-color meta), one per full-screen page
 * background. Keep in sync with tokens.css.
 */
export const THEME_COLORS = {
  cream: THEME_COLOR_CREAM,
  paper: "#fbf7f0",
  ink: "#3b0d12",
  lime: "#d4de3a",
  lav: "#bdb2f5",
  sky: "#a9c7ec",
  peach: "#f7c9a8",
} as const;

export type ThemeColorName = keyof typeof THEME_COLORS;
