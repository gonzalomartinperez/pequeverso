import { site } from "@config/site";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";
import { SkipLink } from "@/components/blocks/skip-link";
import { ConsentBanner } from "@/features/tracking/ConsentBanner";
import { Analytics } from "@/features/tracking/TrackingScripts";
import { RevealObserver } from "@/motion/reveal-observer";
import "./globals.css";

const fonts = ["/fonts/fraunces-latin-wght-7f9d191d.woff2", "/fonts/nunito-sans-latin-wght-29e38904.woff2"];

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Recursos imprimibles para aprender en familia`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  for (const href of fonts) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang={site.locale}>
      <body>
        <SkipLink />
        {children}
        <ConsentBanner />
        <Analytics />
        <RevealObserver />
      </body>
    </html>
  );
}
