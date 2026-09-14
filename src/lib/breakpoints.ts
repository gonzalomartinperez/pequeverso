/** Viewport breakpoints in px (min-width), mirrored in the header of src/styles/tokens.css. */
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export type Breakpoint = keyof typeof breakpoints;

/** Media query string for widths strictly below a breakpoint. */
export function below(name: Breakpoint): string {
  return `(max-width: ${breakpoints[name] - 1}px)`;
}
