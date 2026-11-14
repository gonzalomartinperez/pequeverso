import { jsonLd } from "@/shared/seo/json-ld.ts";

/** Renders one JSON-LD block; renders nothing when there is no data (for example noindex pages). */
export function JsonLdScript({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: jsonLd() escapes "<" in the payload #177
      dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
    />
  );
}
