import { site } from "@config/site";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/ui/SkipLink/SkipLink";
import { ConsentBanner } from "@/features/tracking/ConsentBanner";
import { Analytics } from "@/features/tracking/TrackingScripts";
import { RevealObserver } from "@/motion/RevealObserver";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/utilities.css";

const fraunces = localFont({
  src: "../fonts/fraunces-latin-wght-normal.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

const nunito = localFont({
  src: "../fonts/nunito-sans-latin-wght-normal.woff2",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: "Arial",
});

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
  return (
    <html lang={site.locale} className={`${fraunces.variable} ${nunito.variable}`}>
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
