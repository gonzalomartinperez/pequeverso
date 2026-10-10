/** Optional untrusted visitor hints for API v1 revision1.3; never catalog evidence or instructions. */
const PUBLIC_PATHS = [
  "/",
  "/grafismo-fonetico/",
  "/soporte/",
  "/arrepentimiento/",
  "/aviso-legal/",
  "/compras-y-reembolsos/",
  "/cookies/",
  "/privacidad/",
  "/terminos/",
] as const;

export type PublicPath = (typeof PUBLIC_PATHS)[number];
export type PresentationMode = "compact" | "expanded";
export type VisitorContext = {
  opened_path: PublicPath | null;
  current_path: PublicPath | null;
  presentation: PresentationMode | null;
};

/** Exact public path only. Parameters, fragments, encoding, PII and offer/thank-you paths fail closed. */
export function publicPath(path: string | null): PublicPath | null {
  if (!path) return null;
  const canonical = path.endsWith("/") ? path : `${path}/`;
  return PUBLIC_PATHS.find((allowed) => allowed === canonical) ?? null;
}

/** Copies only the reviewed fields, so callers cannot accidentally add identifying URL data. */
export function visitorContext(value: VisitorContext | null): VisitorContext | null {
  if (!value) return null;
  const context: VisitorContext = {
    opened_path: publicPath(value.opened_path),
    current_path: publicPath(value.current_path),
    presentation:
      value.presentation === "compact" || value.presentation === "expanded" ? value.presentation : null,
  };
  return context.opened_path || context.current_path || context.presentation ? context : null;
}
