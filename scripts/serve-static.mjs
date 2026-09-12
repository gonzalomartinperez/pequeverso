// @ts-check
// Minimal static server for out/ that mimics the production host: trailing-slash
// directories resolve to index.html, missing paths return the real 404 page with
// status 404, and .htaccess-equivalent cache headers are applied. Used by
// Playwright, Lighthouse CI and `npm start`.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT || 3000);
const types = {
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

function send(res, file, status = 200) {
  const ext = extname(file);
  const stat = statSync(file);
  const headers = {
    "Content-Type": types[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
  };
  const rel = file.slice(root.length).split("\\").join("/");
  if (rel.startsWith("/media/") || rel.startsWith("/fonts/") || rel.startsWith("/_next/static/")) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else if (rel === "/build-info.json") {
    headers["Cache-Control"] = "no-store";
  } else if (ext === ".html") {
    headers["Cache-Control"] = "no-cache";
  }
  res.writeHead(status, headers);
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
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
  if (existsSync(file) && statSync(file).isFile()) {
    send(res, file);
    return;
  }
  if (!extname(pathname) && existsSync(`${file}.html`)) {
    send(res, `${file}.html`);
    return;
  }
  const notFound = join(root, "404.html");
  if (existsSync(notFound)) send(res, notFound, 404);
  else res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
}).listen(port, () => console.log(`serve-static: http://localhost:${port} (out/)`));
