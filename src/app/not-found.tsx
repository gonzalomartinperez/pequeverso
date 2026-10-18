import { notFoundCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: copy.meta.title,
  robots: { index: false, follow: false },
};

export { default } from "@/views/not-found-view";
