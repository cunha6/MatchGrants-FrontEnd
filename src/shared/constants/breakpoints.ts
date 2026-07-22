/**
 * Breakpoints mirror the `--bp-*` custom properties in tokens.css.
 * Keep these two in sync — CSS media queries cannot read CSS variables, so the
 * literal pixel values live here for any JS-driven responsive logic (e.g. the
 * hamburger drawer) and in tokens.css for documentation.
 */
export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

/** Media query strings for use with window.matchMedia. */
export const MEDIA = {
  smDown: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  mdDown: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  lgDown: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  mdUp: `(min-width: ${BREAKPOINTS.md}px)`,
  lgUp: `(min-width: ${BREAKPOINTS.lg}px)`,
} as const
