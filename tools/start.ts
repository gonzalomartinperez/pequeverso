// `npm start` for both build targets:
// - standalone (Hostinger Node.js Web App, NEXT_OUTPUT=standalone): copies public/ and .next/static
//   next to the standalone server if they are missing, then runs it (honours PORT/HOSTNAME). The
//   Meta CAPI relay is the route handler src/app/api/meta/events/route.standalone.ts inside Next.
// - SITE_DIR (an assembled site from tools/ci/assemble-site.ts, e.g. verified in CI): runs
//   ${SITE_DIR}/server.js from that directory as it is; nothing is copied.
// - static export (parity build until M4, ADR-0010): serves out/ with production semantics (tools/serve-static.ts),
//   which mounts the same relay from src/features/tracking/adapters/server/meta-capi.ts.
import { cpSync, existsSync, lstatSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { metaCapiOptionsFromEnv } from "../src/features/tracking/adapters/server/meta-capi.ts";

const root = process.cwd();
const standaloneServer = resolve(root, ".next/standalone/server.js");

/** Honour PORT/HOSTNAME like the Hostinger runtime, then run the standalone server in `dir`. */
async function runStandalone(dir: string, server: string): Promise<void> {
  process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
  process.env.PORT = process.env.PORT || "3000";
  process.chdir(dir);
  const options = metaCapiOptionsFromEnv(process.env);
  console.log(`start: standalone server on ${process.env.HOSTNAME}:${process.env.PORT}`);
  console.log(`meta-capi: ${options.pixelId && options.accessToken ? "enabled" : "disabled"}`);
  await import(pathToFileURL(server).href);
}

/** An assembled site inside the repository whose server.js is a regular file, else null. */
function siteServerPath(siteDirEnv: string): { dir: string; server: string } | null {
  if (isAbsolute(siteDirEnv)) return null;
  const dir = resolve(root, siteDirEnv);
  const inside = relative(root, dir);
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) return null;
  const server = resolve(dir, "server.js");
  return existsSync(server) && lstatSync(server).isFile() ? { dir, server } : null;
}

if (process.env.SITE_DIR) {
  const site = siteServerPath(process.env.SITE_DIR);
  if (!site) {
    console.error(
      "start: SITE_DIR must be a relative directory inside the repository with a regular " +
        "server.js; assemble it with tools/ci/assemble-site.ts",
    );
    process.exit(1);
  }
  await runStandalone(site.dir, site.server);
} else if (existsSync(standaloneServer)) {
  const standaloneDir = resolve(root, ".next/standalone");
  for (const [from, to] of [
    ["public", "public"],
    [".next/static", ".next/static"],
  ] as const) {
    const source = resolve(root, from);
    const target = resolve(standaloneDir, to);
    if (existsSync(source) && !existsSync(target)) cpSync(source, target, { recursive: true });
  }
  await runStandalone(standaloneDir, standaloneServer);
} else {
  await import(pathToFileURL(resolve(root, "tools/serve-static.ts")).href);
}
