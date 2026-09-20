// @ts-check
// `npm start` for both build targets, each with the Meta CAPI relay mounted (server/meta-capi.mjs):
// - standalone (Hostinger Node.js Web App, NEXT_OUTPUT=standalone): copies public/ and .next/static
//   next to the standalone server if they are missing, runs it on an internal loopback port and
//   fronts it with server/front.mjs on PORT (relay first, everything else proxied).
// - static export (default): serves out/ with production semantics (scripts/serve-static.mjs).
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createFrontServer, waitForUpstream } from "../server/front.mjs";
import { createMetaCapiHandler, metaCapiOptionsFromEnv } from "../server/meta-capi.mjs";

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
  const hostname = process.env.HOSTNAME || "0.0.0.0";
  const port = Number(process.env.PORT || 3000);
  const upstream = { host: "127.0.0.1", port: port + 1 };
  const options = metaCapiOptionsFromEnv(process.env);
  process.env.HOSTNAME = upstream.host;
  process.env.PORT = String(upstream.port);
  process.chdir(standaloneDir);
  await import(pathToFileURL(standaloneServer).href);
  await waitForUpstream(upstream);
  createFrontServer({ handler: createMetaCapiHandler(options), upstream }).listen(port, hostname, () => {
    console.log(
      `start: standalone server on ${hostname}:${port} (next on ${upstream.host}:${upstream.port})`,
    );
    console.log(`meta-capi: ${options.pixelId && options.accessToken ? "enabled" : "disabled"}`);
  });
} else {
  await import(pathToFileURL(resolve(root, "scripts/serve-static.mjs")).href);
}
