// @ts-check
// Front server for the standalone build: answers the Meta CAPI relay itself and proxies every
// other request (method, headers, body, status, streaming) to Next's standalone server on an
// internal loopback port. A route handler cannot be used because `output: "export"` refuses
// non-GET handlers (docs/decisions/ADR-0005-conversions-api-relay.md).
import { Agent, createServer, request } from "node:http";
import { connect } from "node:net";

/**
 * @typedef {import("node:http").IncomingMessage} IncomingMessage
 * @typedef {import("node:http").ServerResponse} ServerResponse
 * @typedef {(req: IncomingMessage, res: ServerResponse) => Promise<boolean>} Handler
 */

const HOP_BY_HOP = new Set(["connection", "keep-alive", "proxy-connection", "upgrade", "te", "trailer"]);

/** @param {IncomingMessage["headers"]} headers */
function stripHopByHop(headers) {
  /** @type {Record<string, string | string[]>} */
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && !HOP_BY_HOP.has(key)) out[key] = value;
  }
  return out;
}

/**
 * Creates the front `http.Server`: `handler` first, then a transparent proxy to `upstream`.
 * @param {{ handler: Handler, upstream: { host: string, port: number } }} options
 */
export function createFrontServer({ handler, upstream }) {
  const agent = new Agent({ keepAlive: true });
  return createServer(async (req, res) => {
    if (await handler(req, res)) return;
    const proxyReq = request(
      {
        host: upstream.host,
        port: upstream.port,
        method: req.method,
        path: req.url,
        headers: stripHopByHop(req.headers),
        agent,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, stripHopByHop(proxyRes.headers));
        proxyRes.pipe(res);
        proxyRes.on("error", () => res.destroy());
      },
    );
    proxyReq.on("error", () => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("Bad gateway");
    });
    res.on("close", () => {
      if (!proxyReq.destroyed && !proxyReq.writableFinished) proxyReq.destroy();
    });
    req.pipe(proxyReq);
  });
}

/**
 * Resolves once a TCP connection to `host:port` succeeds, or rejects after `timeoutMs`.
 * @param {{ host: string, port: number, timeoutMs?: number, intervalMs?: number }} options
 * @returns {Promise<void>}
 */
export function waitForUpstream({ host, port, timeoutMs = 30_000, intervalMs = 100 }) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = connect({ host, port });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() >= deadline) reject(new Error(`upstream ${host}:${port} not reachable`));
        else setTimeout(attempt, intervalMs);
      });
    };
    attempt();
  });
}
