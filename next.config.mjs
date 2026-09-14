// @ts-check
import bundleAnalyzer from "@next/bundle-analyzer";
import { loadEdgeRules, toNextHeaders, toNextRedirects } from "./scripts/lib/edge-rules.mjs";

/**
 * Build target selection.
 *
 * - Static export (default): `NEXT_OUTPUT` unset or "export". Served from public_html; redirects and
 *   headers come from the generated .htaccess (scripts/gen-htaccess.mjs).
 * - Node server: `NEXT_OUTPUT=standalone`, or automatically when the build runs inside Hostinger's
 *   Node.js Web App builder (its working directory lives under `/hbuilds/`). Hostinger wraps this
 *   config and forces `output: 'standalone'` itself; here we make sure the same redirects/headers
 *   from config/edge-rules.json are attached, since no .htaccess of ours is served in that mode.
 *
 * Builds use `next build --webpack` (package.json): Hostinger's builder has GLIBC 2.28, where the
 * native SWC/Turbopack bindings cannot load and only the WASM fallback (webpack-compatible) works.
 * See docs/architecture.md and docs/decisions/ADR-0001-hosting-target.md.
 */
const onHostingerNodeApp = process.cwd().replace(/\\/g, "/").includes("/hbuilds/");
const output = process.env.NEXT_OUTPUT === "standalone" || onHostingerNodeApp ? "standalone" : "export";
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
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  ...(output === "standalone"
    ? {
        redirects: async () => toNextRedirects(edgeRules),
        headers: async () => toNextHeaders(edgeRules),
      }
    : {}),
};

const withAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "1", openAnalyzer: false });

export default withAnalyzer(nextConfig);
