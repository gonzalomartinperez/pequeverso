/** Public, product-owned schema1. No identity, free text, country or browser URL fields. */
export const profile = {
  "/": ["hero", "leer", "bebe", "preguntas"],
  "/grafismo-fonetico/": ["hero", "incluye", "metodo", "preguntas"],
} as const;
export type Route = keyof typeof profile;
export type Section = (typeof profile)[Route][number];
export type Viewport = "mobile" | "tablet" | "desktop";
export type Intent =
  | { event_name: "page_view" | "section_view"; section_id: Section }
  | {
      event_name: "public_click";
      section_id: Section;
      cell_x: number;
      cell_y: number;
    };
export type Measurement = Intent & {
  schema_version: 1;
  project: "pequeverso";
  source: "site";
  event_id: string;
  route: Route;
  layout_revision: "pequeverso-v1";
  viewport_bucket: Viewport;
  locale: "es";
};
export function routeOf(path: string): Route | null {
  if (path === "/") return "/";
  return path === "/grafismo-fonetico/" || path === "/grafismo-fonetico" ? "/grafismo-fonetico/" : null;
}
export function sectionAllowed(route: Route, section: string): section is Section {
  return (profile[route] as readonly string[]).includes(section);
}
export function viewportOf(width: number): Viewport | null {
  return !Number.isFinite(width) || width <= 0
    ? null
    : width < 768
      ? "mobile"
      : width < 1024
        ? "tablet"
        : "desktop";
}
export function cellOf(
  x: number,
  y: number,
  bounds: { left: number; top: number; width: number; height: number },
): { x: number; y: number } | null {
  if (
    ![x, y, bounds.left, bounds.top, bounds.width, bounds.height].every(Number.isFinite) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  )
    return null;
  const dx = (x - bounds.left) / bounds.width,
    dy = (y - bounds.top) / bounds.height;
  return dx < 0 || dx > 1 || dy < 0 || dy > 1
    ? null
    : { x: Math.min(7, Math.floor(dx * 8)), y: Math.min(7, Math.floor(dy * 8)) };
}
