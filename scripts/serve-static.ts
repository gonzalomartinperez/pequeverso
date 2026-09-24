// Minimal static server for out/ that mimics the production host: trailing-slash
// directories resolve to index.html, missing paths return the real 404 page with
// status 404, and .htaccess-equivalent cache headers are applied. Mounts the Meta
// Conversions API relay (server/meta-capi.ts, POST /api/meta/events/) before static
// resolution. Used by Playwright, Lighthouse CI and `npm start`.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type OutgoingHttpHeaders, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { createMetaCapiHandler, metaCapiOptionsFromEnv } from "../server/meta-capi.ts";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT || 3000);
const metaCapiOptions = metaCapiOptionsFromEnv(process.env);
const metaCapi = createMetaCapiHandler(metaCapiOptions);
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

if (!existsSync(root)) {
  console.error("serve-static: out/ not found. Run `npm run build` first.");
  process.exit(1);
}

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".svg", ".webmanifest"]);

function send(res: ServerResponse, file: string, status = 200, acceptEncoding = ""): void {
  const ext = extname(file);
  const stat = statSync(file);
  const headers: OutgoingHttpHeaders = {
    "Content-Type": types[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
  };
  // Text assets are compressed like production (LiteSpeed/Cloudflare) so Lighthouse measures transfer size.
  if (COMPRESSIBLE.has(ext) && stat.size > 1024) {
    const raw = readFileSync(file);
    const encoding = acceptEncoding.split(",").some((e) => e.trim().startsWith("br"))
      ? "br"
      : acceptEncoding.includes("gzip")
        ? "gzip"
        : null;
    if (encoding) {
      const body =
        encoding === "br"
          ? brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })
          : gzipSync(raw, { level: 6 });
      headers["Content-Encoding"] = encoding;
      headers["Content-Length"] = body.length;
      headers.Vary = "Accept-Encoding";
      applyCache(headers, file, ext);
      res.writeHead(status, headers);
      res.end(body);
      return;
    }
  }
  applyCache(headers, file, ext);
  res.writeHead(status, headers);
  createReadStream(file).pipe(res);
}

function applyCache(headers: OutgoingHttpHeaders, file: string, ext: string): void {
  const rel = file.slice(root.length).split("\\").join("/");
  if (rel.startsWith("/media/") || rel.startsWith("/fonts/") || rel.startsWith("/_next/static/")) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else if (rel === "/build-info.json") {
    headers["Cache-Control"] = "no-store";
  } else if (ext === ".html") {
    headers["Cache-Control"] = "no-cache";
  }
}

createServer(async (req, res) => {
  if (await metaCapi(req, res)) return;
  const url = new URL(req.url || "/", `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.includes("..")) {
    res.writeHead(400).end();
    return;
  }
  let file = normalize(join(root, pathname));
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${pathname}/${url.search}` }).end();
      return;
    }
    file = join(file, "index.html");
  }
  const accept = String(req.headers["accept-encoding"] || "");
  if (existsSync(file) && statSync(file).isFile()) {
    send(res, file, 200, accept);
    return;
  }
  if (!extname(pathname) && existsSync(`${file}.html`)) {
    send(res, `${file}.html`, 200, accept);
    return;
  }
  const notFound = join(root, "404.html");
  if (existsSync(notFound)) send(res, notFound, 404, accept);
  else res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
}).listen(port, () => {
  console.log(`serve-static: http://localhost:${port} (out/)`);
  console.log(
    `meta-capi: ${metaCapiOptions.pixelId && metaCapiOptions.accessToken ? "enabled" : "disabled"}`,
  );
});
