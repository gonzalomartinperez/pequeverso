// @ts-check
import { loadEdgeRules, toNextHeaders, toNextRedirects } from "./scripts/lib/edge-rules.mjs";

/**
 * Build mode is selected by NEXT_OUTPUT so the same codebase can be deployed as
 * static files (default, Hostinger website + .htaccess) or as a Node server
 * (Hostinger Node.js Web App, which forces `standalone` anyway).
 * Redirects and headers live in config/edge-rules.json; in export mode they are
 * emitted to out/.htaccess by scripts/gen-htaccess.mjs, in standalone mode they
 * are attached here. See docs/architecture.md.
 */
const output = process.env.NEXT_OUTPUT === "standalone" ? "standalone" : "export";
const edgeRules = loadEdgeRules();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output,
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Images are optimized at build time by tools/media (WebP derivatives with
    // content hashes); no runtime optimizer is needed on either target.
    unoptimized: true,
  },
  generateBuildId: async () => process.env.GITHUB_SHA || null,
  ...(output === "standalone"
    ? {
        redirects: async () => toNextRedirects(edgeRules),
        headers: async () => toNextHeaders(edgeRules),
      }
    : {}),
};

export default nextConfig;
