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

## Loaders

- `ShiftLoader` ("The Shift Change"): full-screen loader. Lime / lavender / maroon slabs slide across
  each other carrying soft 3D objects, a buddy rides one slab, a `[bracket]` word swaps at each cross
  (`learn`, `build`, `level up`). Props: `ready`, `buddy`, `words`, `delayMs` (250), `contained`
  (fill a frame instead of the screen), `reducedMotion`, `onExited`. Shows nothing before the delay,
  always finishes the current cross, then parts like a curtain (or fades when the panels were
  already leaving). Reduced motion: one still panel, the object and a fading word. The browser bar
  follows the top panel. Timing and sequence rules live in `shift-loader-timing.ts` and the
  `useShiftStages` hook (tested).
- Route use: render `<ShiftLoaderHost />` once in a layout that persists (done in `(app)/layout`)
  and `<ShiftLoading />` inside a `loading.tsx` or Suspense fallback. The fallback only signals the
  wait; the host owns the visible loader, so it can play the exit after the fallback is gone.
  `firstEntryOnly` = full sweep on first load, later only when slower than `slowDelayMs`.
- Tab-to-tab: use `Shimmer` skeletons, not the full sweep.
- `Button loading`: label becomes three bouncing dots, width kept, disabled, `aria-busy`.
- `Shimmer`: soft skeleton block tinted per page (`tone`), optional `peek` buddy on the first card.
- `TypingBubble`: "customer is typing" chat bubble. `LoadingDots`: the three dots.
- `ContextLoader variant="scene" | "call"`: inline "Setting the scene…" / "Connecting call…"
  (ringing headset) for real waits inside a screen.
- Previews: `/dev/gallery` (Loaders section) and `/dev/loaders` (full-screen, for a phone).
