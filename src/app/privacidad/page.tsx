import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/privacidad/",
  title: "Política de privacidad",
  description:
    "Qué datos personales se tratan en pequeverso.com, con qué finalidad, con quién se comparten, cuánto se conservan y cómo ejercer tus derechos según la Ley 25.326.",
  noindex: true,
});

export { default } from "@/views/legal/privacidad-view";
