# components/ui

Shared UI kit (buttons, pills, cards, tab bar). Uses design tokens only.

## Phone browser bar colour

Every full-screen page must keep the browser bar (`meta[name="theme-color"]`) in sync with its
background. The root layout sets cream for light and dark phones. A page with another full-screen
colour (splash, intro scenes, celebrations) calls `useThemeColor("lav")` (client) or renders
`<ThemeColor color="lav" />` (server page). It restores the previous colour on unmount. Colours
live in `src/styles/theme-color.ts`.

## Motion

`Stagger` + `Rise` / `Pop` / `Drop`, `RiseText` / `RiseHeadline`, `ShakeText`, `AnimatedCheck`,
`AnimatedWordmark`. All respect `prefers-reduced-motion` and animate transform/opacity only.
