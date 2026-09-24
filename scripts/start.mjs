// @ts-check
// `npm start` for both build targets:
// - standalone (Hostinger Node.js Web App, NEXT_OUTPUT=standalone): copies public/ and .next/static
//   next to the standalone server if they are missing, then runs it (honours PORT/HOSTNAME). The
//   Meta CAPI relay is the route handler src/app/api/meta/events/route.standalone.ts inside Next.
// - static export (default): serves out/ with production semantics (scripts/serve-static.mjs),
//   which mounts the same relay from server/meta-capi.mjs.
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { metaCapiOptionsFromEnv } from "../server/meta-capi.mjs";

const root = process.cwd();
const standaloneServer = resolve(root, ".next/standalone/server.js");

if (existsSync(standaloneServer)) {
  const standaloneDir = resolve(root, ".next/standalone");
  for (const [from, to] of [
    ["public", "public"],
    [".next/static", ".next/static"],
  ]) {
    const source = resolve(root, from);
    const target = resolve(standaloneDir, to);
    if (existsSync(source) && !existsSync(target)) cpSync(source, target, { recursive: true });
  }
  process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
  process.env.PORT = process.env.PORT || "3000";
  process.chdir(standaloneDir);
  const options = metaCapiOptionsFromEnv(process.env);
  console.log(`start: standalone server on ${process.env.HOSTNAME}:${process.env.PORT}`);
  console.log(`meta-capi: ${options.pixelId && options.accessToken ? "enabled" : "disabled"}`);
  await import(pathToFileURL(standaloneServer).href);
} else {
  await import(pathToFileURL(resolve(root, "scripts/serve-static.mjs")).href);
}
