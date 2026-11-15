// Test-only front for the assembled standalone site (roadmap M4-2, ADR-0010). It starts the REAL
// production server (`<SITE_DIR>/server.js`, assembled by tools/ci/assemble-site.ts) on an
// internal port and proxies to it, adding only what the test host needs:
// - brotli/gzip for compressible text, as the production edge (LiteSpeed, Cloudflare) does, so
//   Lighthouse measures transfer sizes comparable with ratchets/lighthouse-lab.json (Next's own
//   server only gzips);
// - HTTPS with a throwaway certificate for the assistant loopback suite (SERVE_TLS_CERT/KEY).
// Headers, redirects, status codes and the Meta CAPI relay all come from the Next server itself.
// Usage: SITE_DIR=site PORT=3000 node tools/serve-site.ts
import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
  createServer,
  type IncomingHttpHeaders,
  type IncomingMessage,
  request,
  type ServerResponse,
} from "node:http";
import { createServer as createTlsServer } from "node:https";
import { join, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const COMPRESSIBLE =
  /^(text\/(?!event-stream)|application\/(json|javascript|xml|manifest\+json)|image\/svg\+xml)/;
const MIN_BYTES = 1024;
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-connection",
]);

/** The encoding to apply: brotli when accepted, else gzip, else none. */
export function chooseEncoding(acceptEncoding: string | undefined): "br" | "gzip" | null {
  const accepted = (acceptEncoding ?? "").split(",").map((part) => part.trim().split(";")[0]);
  if (accepted.includes("br")) return "br";
  return accepted.includes("gzip") ? "gzip" : null;
}

/** Whether a full (200) identity response of this type and size is compressed on the way out. */
export function shouldCompress(headers: IncomingHttpHeaders, size: number, status = 200): boolean {
  if (status !== 200 || headers["content-range"]) return false;
  if (headers["content-encoding"] && headers["content-encoding"] !== "identity") return false;
  return size > MIN_BYTES && COMPRESSIBLE.test(String(headers["content-type"] ?? ""));
}

export function compress(body: Buffer, encoding: "br" | "gzip"): Buffer {
  return encoding === "br"
    ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })
    : gzipSync(body, { level: 6 });
}

/** Response headers to forward: hop-by-hop and length/encoding are recomputed by the proxy. */
export function forwardHeaders(headers: IncomingHttpHeaders): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || HOP_BY_HOP.has(name)) continue;
    if (name === "content-length" || name === "content-encoding") continue;
    out[name] = value;
  }
  return out;
}

/** `Vary` with `Accept-Encoding` exactly once. */
export function withAcceptEncoding(vary: string | undefined): string {
  if (!vary) return "Accept-Encoding";
  return /(^|,)\s*accept-encoding\s*(,|$)/i.test(vary) ? vary : `${vary}, Accept-Encoding`;
}

/** HEAD and bodiless statuses keep the upstream framing untouched. */
function passThrough(res: ServerResponse, status: number, headers: IncomingHttpHeaders): void {
  const out = forwardHeaders(headers);
  for (const name of ["content-length", "content-encoding"] as const)
    if (headers[name] !== undefined) out[name] = String(headers[name]);
  res.writeHead(status, out);
  res.end();
}

/** Sends the upstream body, compressed when the client accepts it and the type qualifies. */
export function respond(
  res: ServerResponse,
  status: number,
  headers: IncomingHttpHeaders,
  body: Buffer,
  request: { method?: string | undefined; acceptEncoding?: string | undefined },
): void {
  if (request.method === "HEAD" || status === 204 || status === 304) {
    passThrough(res, status, headers);
    return;
  }
  const out = forwardHeaders(headers);
  const compressible = shouldCompress(headers, body.length, status);
  const encoding = compressible ? chooseEncoding(request.acceptEncoding) : null;
  const payload = encoding ? compress(body, encoding) : body;
  if (encoding) {
    out["content-encoding"] = encoding;
    out.vary = withAcceptEncoding(headers.vary);
    // Different bytes than the upstream's strong validator describes.
    if (typeof headers.etag === "string") out.etag = headers.etag.replace(/^(W\/)?/, "W/");
  } else if (headers["content-encoding"]) out["content-encoding"] = headers["content-encoding"];
  out["content-length"] = String(payload.length);
  res.writeHead(status, out);
  res.end(payload);
}

/** Request headers for the upstream: identity bodies plus the front's forwarding facts. */
export function upstreamHeaders(front: IncomingMessage, secure: boolean): IncomingHttpHeaders {
  return {
    ...front.headers,
    "accept-encoding": "identity",
    "x-forwarded-proto": secure ? "https" : "http",
    "x-forwarded-host": front.headers.host ?? "",
    "x-forwarded-for": front.socket.remoteAddress ?? "",
  };
}

function proxy(
  upstreamPort: number,
  secure: boolean,
  front: IncomingMessage,
  res: ServerResponse,
): void {
  const headers = upstreamHeaders(front, secure);
  const upstream = request(
    { host: "127.0.0.1", port: upstreamPort, method: front.method, path: front.url, headers },
    (reply) => {
      const chunks: Buffer[] = [];
      reply.on("data", (chunk: Buffer) => chunks.push(chunk));
      reply.on("error", () => res.destroy());
      reply.on("aborted", () => res.destroy());
      reply.on("end", () =>
        respond(res, reply.statusCode ?? 502, reply.headers, Buffer.concat(chunks), {
          method: front.method,
          acceptEncoding: front.headers["accept-encoding"],
        }),
      );
    },
  );
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end("upstream unavailable");
  });
  res.on("close", () => upstream.destroy());
  front.pipe(upstream);
}

/** Resolves once the upstream answers any HTTP request (or rejects after `timeoutMs`). */
export async function waitForUpstream(port: number, timeoutMs = 30_000): Promise<void> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const up = await new Promise<boolean>((done) => {
      const probe = request({ host: "127.0.0.1", port, path: "/build-info.json" }, (reply) => {
        reply.resume();
        done(true);
      });
      probe.on("error", () => done(false));
      probe.setTimeout(1000, () => probe.destroy());
      probe.end();
    });
    if (up) return;
    await new Promise((wait) => setTimeout(wait, 250));
  }
  throw new Error(`site server did not start on port ${port}`);
}

function startUpstream(siteDir: string, port: number): ChildProcess {
  const server = join(siteDir, "server.js");
  if (!existsSync(server)) throw new Error(`${server} not found; run tools/ci/assemble-site.ts`);
  return spawn(process.execPath, [server], {
    cwd: siteDir,
    env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
    stdio: ["ignore", "inherit", "inherit"],
  });
}

async function main(): Promise<void> {
  const siteDir = resolve(process.env.SITE_DIR || "site");
  const port = Number(process.env.PORT || 3000);
  const upstreamPort = Number(process.env.SITE_UPSTREAM_PORT || port + 1000);
  const child = startUpstream(siteDir, upstreamPort);
  // Every way out of this process takes the site server with it (no orphan on the port).
  process.on("exit", () => child.kill("SIGTERM"));
  child.on("exit", (code) => process.exit(code ?? 1));
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const)
    process.on(signal, () => process.exit(0));
  await waitForUpstream(upstreamPort);
  const cert = process.env.SERVE_TLS_CERT;
  const key = process.env.SERVE_TLS_KEY;
  const secure = Boolean(cert && key);
  const handler = (req: IncomingMessage, res: ServerResponse) =>
    proxy(upstreamPort, secure, req, res);
  const server =
    cert && key
      ? createTlsServer({ cert: readFileSync(cert), key: readFileSync(key) }, handler)
      : createServer(handler);
  server.on("error", (error) => {
    console.error(`serve-site: ${error.message}`);
    process.exit(1);
  });
  server.listen(port, () =>
    console.log(`serve-site: ${cert ? "https" : "http"}://localhost:${port} (${siteDir})`),
  );
}

if (import.meta.main)
  main().catch((error: unknown) => {
    console.error(`serve-site: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
