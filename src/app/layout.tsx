import { site } from "@config/site";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";
import { SkipLink } from "@/components/blocks/skip-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { ConsentBanner } from "@/features/tracking/ConsentBanner";
import { Analytics } from "@/features/tracking/TrackingScripts";
import { versionedPublicUrl } from "@/lib/media";
import { RevealObserver } from "@/motion/reveal-observer";
import "./globals.css";

const consentClasses = {
  primary: buttonVariants({ variant: "secondary", size: "sm" }),
  secondary: buttonVariants({ variant: "ghost", size: "sm" }),
};

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
      { url: versionedPublicUrl("/favicon.ico"), sizes: "16x16 32x32 48x48" },
      { url: versionedPublicUrl("/icon-192.png"), type: "image/png", sizes: "192x192" },
      { url: versionedPublicUrl("/favicon.png"), type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: versionedPublicUrl("/apple-touch-icon.png"), sizes: "180x180" }],
  },
  manifest: `/manifest.webmanifest?v=${versionedPublicUrl("/icon-512.png").split("?v=")[1]}`,
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
        <ConsentBanner classes={consentClasses} />
        <Analytics />
        <RevealObserver />
      </body>
    </html>
  );
}
