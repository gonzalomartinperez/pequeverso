// @ts-check
// First-party relay for the Meta Conversions API: the browser posts the events it already sent
// to the pixel (same event ids) and this handler forwards them to Graph API from the server so
// Meta deduplicates browser/server pairs. Mounted by scripts/serve-static.mjs (static export)
// and scripts/start.mjs (standalone front server). Zero dependencies; Node 24 built-ins only.
import { isIP } from "node:net";

/**
 * @typedef {import("node:http").IncomingMessage} IncomingMessage
 * @typedef {import("node:http").ServerResponse} ServerResponse
 * @typedef {{ name: string, eventId: string, time: number, sourceUrl: string, params: Record<string, string | number>, fbp?: string, fbc?: string }} RelayEvent
 * @typedef {{ status: number, ok: boolean, attempts: number }} UpstreamResult
 * @typedef {{
 *   pixelId: string,
 *   accessToken: string,
 *   siteUrl?: string,
 *   fetchImpl?: typeof fetch,
 *   now?: () => number,
 *   log?: (line: string) => void,
 *   onResult?: (result: UpstreamResult) => void,
 *   rateLimit?: { events: number, windowMs: number },
 *   timeoutMs?: number,
 * }} HandlerOptions
 * @typedef {((req: IncomingMessage, res: ServerResponse) => Promise<boolean>) & { pending: Set<Promise<void>> }} MetaCapiHandler
 */

export const META_CAPI_PATH = "/api/meta/events";
export const GRAPH_API_VERSION = "v26.0";
const DEFAULT_SITE_URL = "https://pequeverso.com";
const MAX_BODY_BYTES = 16 * 1024;
const MAX_EVENTS = 10;
const MAX_STRING = 200;
const MAX_URL = 2048;
const TIME_SKEW_MS = 10 * 60 * 1000;
const ALLOWED_EVENTS = new Set(["PageView", "ViewContent", "PequeversoProductInterest", "CheckoutIntent"]);
const FORBIDDEN_EVENTS = new Set(["InitiateCheckout", "Purchase", "PlaceAnOrder", "begin_checkout"]);
const ALLOWED_PARAMS = new Set([
  "content_ids",
  "content_name",
  "content_type",
  "value",
  "currency",
  "product",
  "offer",
  "cta_position",
  "offer_mode",
  "destination",
]);
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FB_COOKIE = /^fb\.\d\.\d{1,16}\.[A-Za-z0-9._%-]{1,255}$/;
const NO_STORE = { "Cache-Control": "no-store" };

class ValidationError extends Error {
  /** @param {string} reason */
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

/** @param {unknown} value @param {number} max */
function isShortString(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} raw
 * @param {Set<string>} origins
 * @param {number} now
 * @returns {RelayEvent}
 */
function validateEvent(raw, origins, now) {
  if (!isPlainObject(raw)) throw new ValidationError("event");
  const { name, eventId, time, sourceUrl, params, fbp, fbc } = raw;
  if (typeof name !== "string" || FORBIDDEN_EVENTS.has(name) || !ALLOWED_EVENTS.has(name))
    throw new ValidationError("name");
  if (typeof eventId !== "string" || !UUID_V4.test(eventId)) throw new ValidationError("eventId");
  if (typeof time !== "number" || !Number.isFinite(time)) throw new ValidationError("time");
  if (!isShortString(sourceUrl, MAX_URL)) throw new ValidationError("sourceUrl");
  let origin;
  try {
    origin = new URL(/** @type {string} */ (sourceUrl)).origin;
  } catch {
    throw new ValidationError("sourceUrl");
  }
  if (!origins.has(origin)) throw new ValidationError("sourceUrl");
  /** @type {Record<string, string | number>} */
  const clean = {};
  if (params !== undefined) {
    if (!isPlainObject(params)) throw new ValidationError("params");
    for (const [key, value] of Object.entries(params)) {
      if (!ALLOWED_PARAMS.has(key)) throw new ValidationError("params");
      if (typeof value === "string") {
        if (value.length > MAX_STRING) throw new ValidationError("params");
        clean[key] = value;
      } else if (typeof value === "number" && Number.isFinite(value)) {
        clean[key] = value;
      } else {
        throw new ValidationError("params");
      }
    }
  }
  if (fbp !== undefined && (typeof fbp !== "string" || !FB_COOKIE.test(fbp)))
    throw new ValidationError("fbp");
  if (fbc !== undefined && (typeof fbc !== "string" || !FB_COOKIE.test(fbc)))
    throw new ValidationError("fbc");
  const clamped = Math.min(Math.max(time, now - TIME_SKEW_MS), now);
  return {
    name,
    eventId: eventId.toLowerCase(),
    time: clamped,
    sourceUrl: /** @type {string} */ (sourceUrl),
    params: clean,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };
}

/** @param {unknown} body @param {Set<string>} origins @param {number} now @returns {RelayEvent[]} */
function validateBody(body, origins, now) {
  if (!isPlainObject(body) || !Array.isArray(body.events)) throw new ValidationError("events");
  if (body.events.length < 1 || body.events.length > MAX_EVENTS) throw new ValidationError("events");
  return body.events.map((event) => validateEvent(event, origins, now));
}

/** @param {IncomingMessage} req */
function clientIp(req) {
  const cf = req.headers["cf-connecting-ip"];
  const xff = req.headers["x-forwarded-for"];
  const candidates = [
    typeof cf === "string" ? cf : "",
    typeof xff === "string" ? xff.split(",")[0] : "",
    req.socket?.remoteAddress || "",
  ];
  for (const raw of candidates) {
    const value = raw.trim().replace(/^::ffff:/i, "");
    if (value && isIP(value)) return value;
  }
  return "";
}

/** @param {string} value */
function parseOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** @param {IncomingMessage} req @param {string} siteOrigin */
function allowedOrigins(req, siteOrigin) {
  const origins = new Set([siteOrigin]);
  const host = req.headers.host;
  if (typeof host === "string" && /^[a-z0-9.:[\]-]+$/i.test(host)) {
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }
  return origins;
}

/** @param {IncomingMessage} req @param {number} limit @returns {Promise<string>} */
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new ValidationError("size"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** @param {ServerResponse} res @param {number} status @param {string} [reason] */
function reply(res, status, reason) {
  if (reason === undefined) {
    res.writeHead(status, NO_STORE).end();
    return;
  }
  res.writeHead(status, { ...NO_STORE, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: reason }));
}

/** Token bucket per client IP. */
class RateLimiter {
  /** @param {{ events: number, windowMs: number }} config @param {() => number} now */
  constructor(config, now) {
    this.capacity = config.events;
    this.refillPerMs = config.events / config.windowMs;
    this.now = now;
    /** @type {Map<string, { tokens: number, at: number }>} */
    this.buckets = new Map();
  }

  /** @param {string} key @param {number} cost */
  take(key, cost) {
    const at = this.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, at };
    bucket.tokens = Math.min(this.capacity, bucket.tokens + (at - bucket.at) * this.refillPerMs);
    bucket.at = at;
    if (bucket.tokens < cost) {
      this.buckets.set(key, bucket);
      return false;
    }
    bucket.tokens -= cost;
    this.buckets.set(key, bucket);
    if (this.buckets.size > 10_000) this.prune(at);
    return true;
  }

  /** @param {number} at */
  prune(at) {
    const stale = this.capacity / this.refillPerMs;
    for (const [key, bucket] of this.buckets) if (at - bucket.at > stale) this.buckets.delete(key);
  }
}

/**
 * Handler options from the process environment: `NEXT_PUBLIC_META_PIXEL_ID` (shared with the
 * browser pixel), the server-only `META_CAPI_ACCESS_TOKEN` and `NEXT_PUBLIC_SITE_URL`.
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ pixelId: string, accessToken: string, siteUrl: string }}
 */
export function metaCapiOptionsFromEnv(env) {
  return {
    pixelId: (env.NEXT_PUBLIC_META_PIXEL_ID || "").trim(),
    accessToken: (env.META_CAPI_ACCESS_TOKEN || "").trim(),
    siteUrl: (env.NEXT_PUBLIC_SITE_URL || "").trim() || DEFAULT_SITE_URL,
  };
}

/**
 * Builds the `(req, res) => Promise<boolean>` handler for `POST /api/meta/events`. Returns
 * `false` for any other path so the caller continues. With an empty `pixelId` or
 * `accessToken` every valid request gets `204` and Meta is never called. Upstream calls run
 * after the `202` response (bearer token header, one retry on 429/5xx/network error);
 * `handler.pending` holds their promises for tests and shutdown.
 * @param {HandlerOptions} options
 * @returns {MetaCapiHandler}
 */
export function createMetaCapiHandler(options) {
  const {
    pixelId,
    accessToken,
    siteUrl = DEFAULT_SITE_URL,
    fetchImpl = fetch,
    now = Date.now,
    log = (line) => console.error(line),
    onResult,
    rateLimit = { events: 60, windowMs: 60_000 },
    timeoutMs = 3000,
  } = options;
  const enabled = Boolean(pixelId) && Boolean(accessToken);
  const siteOrigin = parseOrigin(siteUrl) ?? DEFAULT_SITE_URL;
  const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events`;
  const limiter = new RateLimiter(rateLimit, now);
  /** @type {Set<Promise<void>>} */
  const pending = new Set();

  /** @param {RelayEvent[]} events @param {string} ip @param {string} userAgent */
  function payload(events, ip, userAgent) {
    return {
      data: events.map((event) => ({
        event_name: event.name,
        event_time: Math.floor(event.time / 1000),
        event_id: event.eventId,
        event_source_url: event.sourceUrl,
        action_source: "website",
        user_data: {
          ...(ip ? { client_ip_address: ip } : {}),
          ...(userAgent ? { client_user_agent: userAgent } : {}),
          ...(event.fbp ? { fbp: event.fbp } : {}),
          ...(event.fbc ? { fbc: event.fbc } : {}),
        },
        ...(Object.keys(event.params).length > 0 ? { custom_data: event.params } : {}),
      })),
    };
  }

  /** @param {string} body @returns {Promise<{ status: number, detail: string }>} */
  async function post(body) {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    let detail = "";
    if (!response.ok) {
      try {
        const json = /** @type {{ error?: { code?: number, fbtrace_id?: string } }} */ (
          await response.json()
        );
        const code = json?.error?.code;
        const trace = json?.error?.fbtrace_id;
        detail = `${code !== undefined ? ` code=${code}` : ""}${trace ? ` fbtrace=${trace}` : ""}`;
      } catch {
        detail = "";
      }
    }
    return { status: response.status, detail };
  }

  /** @param {string} body @returns {Promise<void>} */
  async function relay(body) {
    let attempts = 0;
    /** @type {{ status: number, detail: string } | null} */
    let last = null;
    /** @type {string} */
    let failure = "";
    while (attempts < 2) {
      attempts += 1;
      try {
        last = await post(body);
        if (last.status < 500 && last.status !== 429) break;
        failure = `upstream ${last.status >= 500 ? "5xx" : "4xx"} ${last.status}${last.detail}`;
      } catch (error) {
        last = null;
        failure = `upstream error ${error instanceof Error ? error.name : "unknown"}`;
      }
    }
    const status = last?.status ?? 0;
    const ok = status >= 200 && status < 300;
    if (!ok) {
      if (status >= 400 && status < 500) failure = `upstream 4xx ${status}${last?.detail ?? ""}`;
      log(`meta-capi: ${failure}`);
    }
    onResult?.({ status, ok, attempts });
  }

  /** @type {MetaCapiHandler} */
  const handler = Object.assign(
    /** @param {IncomingMessage} req @param {ServerResponse} res */
    async (req, res) => {
      const pathname = (req.url || "/").split("?")[0];
      if (pathname !== META_CAPI_PATH) return false;
      if (req.method !== "POST") {
        res.writeHead(405, { ...NO_STORE, Allow: "POST" }).end();
        req.resume();
        return true;
      }
      const origins = allowedOrigins(req, siteOrigin);
      const origin = req.headers.origin;
      if (typeof origin === "string" && !origins.has(origin)) {
        reply(res, 403, "origin");
        req.resume();
        return true;
      }
      if (!enabled) {
        reply(res, 204);
        req.resume();
        return true;
      }
      const type = String(req.headers["content-type"] || "");
      if (!/^application\/json\b/i.test(type)) {
        reply(res, 415, "content-type");
        req.resume();
        return true;
      }
      if (Number(req.headers["content-length"] || 0) > MAX_BODY_BYTES) {
        reply(res, 413, "size");
        req.resume();
        return true;
      }
      let text;
      try {
        text = await readBody(req, MAX_BODY_BYTES);
      } catch (error) {
        if (error instanceof ValidationError) reply(res, 413, error.reason);
        else reply(res, 400, "body");
        return true;
      }
      let events;
      try {
        events = validateBody(JSON.parse(text), origins, now());
      } catch (error) {
        reply(res, 400, error instanceof ValidationError ? error.reason : "json");
        return true;
      }
      const ip = clientIp(req);
      if (!limiter.take(ip || "unknown", events.length)) {
        reply(res, 429, "rate");
        return true;
      }
      const body = JSON.stringify(payload(events, ip, String(req.headers["user-agent"] || "")));
      reply(res, 202);
      const job = relay(body).finally(() => pending.delete(job));
      pending.add(job);
      return true;
    },
    { pending },
  );
  return handler;
}
