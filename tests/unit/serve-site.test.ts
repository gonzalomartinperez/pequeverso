import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import { type AddressInfo, connect, createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import {
  chooseEncoding,
  compress,
  forwardHeaders,
  shouldCompress,
  waitForUpstream,
  withAcceptEncoding,
} from "../../tools/serve-site.ts";

const tool = resolve(import.meta.dirname, "../../tools/serve-site.ts");

test("brotli is preferred, then gzip, honouring q-values syntax", () => {
  assert.equal(chooseEncoding("gzip, deflate, br"), "br");
  assert.equal(chooseEncoding("br;q=1.0, gzip;q=0.8"), "br");
  assert.equal(chooseEncoding("gzip"), "gzip");
  assert.equal(chooseEncoding("identity"), null);
  assert.equal(chooseEncoding(undefined), null);
});

test("only identity text above 1 KB is compressed", () => {
  const js = { "content-type": "application/javascript; charset=utf-8" };
  assert.equal(shouldCompress(js, 2048), true);
  assert.equal(shouldCompress(js, 512), false);
  assert.equal(shouldCompress({ "content-type": "text/html" }, 4096), true);
  assert.equal(shouldCompress({ "content-type": "image/svg+xml" }, 4096), true);
  assert.equal(shouldCompress({ "content-type": "image/webp" }, 4096), false);
  assert.equal(shouldCompress({ ...js, "content-encoding": "gzip" }, 4096), false);
  assert.equal(shouldCompress({}, 4096), false);
});

test("compression round-trips and hop-by-hop headers are dropped", () => {
  const body = Buffer.from("x".repeat(5000));
  assert.deepEqual(brotliDecompressSync(compress(body, "br")), body);
  assert.deepEqual(gunzipSync(compress(body, "gzip")), body);
  assert.deepEqual(
    forwardHeaders({
      "content-type": "text/html",
      "content-length": "10",
      "content-encoding": "identity",
      connection: "keep-alive",
      "transfer-encoding": "chunked",
      "cache-control": "no-cache",
      "set-cookie": ["a=1", "b=2"],
    }),
    { "content-type": "text/html", "cache-control": "no-cache", "set-cookie": ["a=1", "b=2"] },
  );
});

test("Vary names Accept-Encoding exactly once", () => {
  assert.equal(withAcceptEncoding(undefined), "Accept-Encoding");
  assert.equal(withAcceptEncoding("rsc"), "rsc, Accept-Encoding");
  assert.equal(withAcceptEncoding("rsc, Accept-Encoding"), "rsc, Accept-Encoding");
  assert.equal(withAcceptEncoding("accept-encoding"), "accept-encoding");
});

test("waiting for an absent upstream fails after its deadline", async () => {
  await assert.rejects(waitForUpstream(1, 300), /did not start/);
});

type Reply = { status: number; headers: Record<string, unknown>; body: Buffer };

function call(
  port: number,
  path: string,
  options: { method?: string; encoding?: string; body?: string; range?: string } = {},
): Promise<Reply> {
  return new Promise((done, fail) => {
    const headers: Record<string, string> = { "accept-encoding": options.encoding ?? "br" };
    if (options.range) headers.range = options.range;
    if (options.body) headers["content-type"] = "application/json";
    const req = request(
      { host: "127.0.0.1", port, path, method: options.method ?? "GET", headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () =>
          done({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }),
        );
      },
    );
    req.on("error", fail);
    req.end(options.body);
  });
}

/** A port nobody listens on right now (the OS picks it). */
function freePort(): Promise<number> {
  return new Promise((done) => {
    const probe = createNetServer().listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => done(port));
    });
  });
}

function listening(port: number): Promise<boolean> {
  return new Promise((done) => {
    const socket = connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      done(true);
    });
    socket.once("error", () => done(false));
  });
}

// A stand-in for Next's server.js: identity responses only, like the standalone server with
// compression left to the proxy.
const STAND_IN = `const http = require("node:http");
const js = "console.log(1);".repeat(200);
http.createServer((req, res) => {
  if (req.url === "/app.js") {
    const headers = { "content-type": "application/javascript", "cache-control": "immutable", etag: '"abc"' };
    if (req.headers.range) {
      res.writeHead(206, { ...headers, "content-range": "bytes 0-9/" + js.length, "content-length": 10 });
      return res.end(js.slice(0, 10));
    }
    res.writeHead(200, { ...headers, "content-length": js.length });
    return res.end(req.method === "HEAD" ? undefined : js);
  }
  if (req.url === "/old/") { res.writeHead(308, { location: "/new/" }); return res.end(); }
  if (req.url === "/api/meta/events/" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    return req.on("end", () => {
      res.writeHead(202, { "content-type": "application/json", "set-cookie": ["a=1", "b=2"] });
      res.end(JSON.stringify({ body, proto: req.headers["x-forwarded-proto"] }));
    });
  }
  res.writeHead(req.url === "/build-info.json" ? 200 : 404, { "content-type": "text/plain" });
  res.end(req.headers["accept-encoding"] || "none");
}).listen(Number(process.env.PORT), process.env.HOSTNAME);
`;

test("end to end: the real proxy path, framing edge cases and an orphan-free shutdown", async () => {
  const site = mkdtempSync(join(tmpdir(), "pv-serve-site-"));
  writeFileSync(join(site, "server.js"), STAND_IN);
  const [port, upstream] = [await freePort(), await freePort()];
  const child = spawn(process.execPath, [tool], {
    env: {
      ...process.env,
      SITE_DIR: site,
      PORT: String(port),
      SITE_UPSTREAM_PORT: String(upstream),
    },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const exited = new Promise((done) => child.once("exit", done));
  try {
    await waitForUpstream(port, 15_000);
    const js = await call(port, "/app.js", { encoding: "gzip, br" });
    assert.equal(js.headers["content-encoding"], "br");
    assert.equal(js.headers["cache-control"], "immutable");
    assert.equal(js.headers.etag, 'W/"abc"');
    assert.equal(brotliDecompressSync(js.body).toString(), "console.log(1);".repeat(200));
    const gzipped = await call(port, "/app.js", { encoding: "gzip" });
    assert.equal(gunzipSync(gzipped.body).toString(), "console.log(1);".repeat(200));
    const plain = await call(port, "/app.js", { encoding: "identity" });
    assert.equal(plain.headers["content-encoding"], undefined);
    const head = await call(port, "/app.js", { method: "HEAD" });
    assert.equal(head.headers["content-length"], String(3000));
    assert.equal(head.headers["content-encoding"], undefined);
    const partial = await call(port, "/app.js", { range: "bytes=0-9" });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers["content-encoding"], undefined);
    assert.equal(partial.body.toString(), "console.lo");
    const moved = await call(port, "/old/");
    assert.equal(moved.status, 308);
    assert.equal(moved.headers.location, "/new/");
    const relay = await call(port, "/api/meta/events/", { method: "POST", body: '{"events":[]}' });
    assert.equal(relay.status, 202);
    assert.deepEqual(relay.headers["set-cookie"], ["a=1", "b=2"]);
    assert.deepEqual(JSON.parse(relay.body.toString()), { body: '{"events":[]}', proto: "http" });
    const missing = await call(port, "/nope/");
    assert.equal(missing.status, 404);
    // The upstream is always asked for identity bodies; the proxy owns compression.
    assert.equal(missing.body.toString(), "identity");
  } finally {
    child.kill("SIGTERM");
    await exited;
    rmSync(site, { recursive: true, force: true });
  }
  assert.equal(await listening(upstream), false, "the site server must not outlive the proxy");
});
