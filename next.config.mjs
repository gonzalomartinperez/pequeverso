// The configuration is TypeScript: config/next.ts, loaded through Node's native type stripping.
// This file keeps the `next.config.mjs` name that Hostinger's Node.js builder wraps and that loads
// without SWC on its GLIBC 2.28 image (ADR-0007). It must contain nothing else.
export { default } from "./config/next.ts";
