// First-party relay for the Meta Conversions API: the browser posts the events it already sent
// to the pixel (same event ids) and this handler forwards them to Graph API from the server so
// Meta deduplicates browser/server pairs. Transport-agnostic core (createMetaCapiRelay) used by
// the Node adapter in scripts/serve-static.ts (static export) and by the standalone route
// handler src/app/api/meta/events/route.standalone.ts. Zero dependencies; Node built-ins only.
import type { IncomingMessage, ServerResponse } from "node:http";
import { isIP } from "node:net";

type RelayEvent = {
  name: string;
  eventId: string;
  time: number;
  sourceUrl: string;
  params: Record<string, string | number>;
  fbp?: string;
  fbc?: string;
};

/** Outcome of one upstream batch (reported through `RelayOptions.onResult`). */
export type UpstreamResult = { status: number; ok: boolean; attempts: number };

/** Relay configuration; everything but the credentials has a production default. */
export type RelayOptions = {
  pixelId: string;
  accessToken: string;
  siteUrl?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  log?: (line: string) => void;
  onResult?: (result: UpstreamResult) => void;
  rateLimit?: { events: number; windowMs: number };
  timeoutMs?: number;
};

/** One request as seen by the transport-agnostic core (headers already extracted). */
export type RelayInput = {
  method: string;
  bodyText: string;
  contentType?: string | undefined;
  origin?: string | undefined;
  host?: string | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
};

/** The response the adapter must write. */
export type RelayResult = { status: number; headers: Record<string, string>; body?: string };

/** Relay instance: `process` answers synchronously; upstream calls are tracked in `pending`. */
export type MetaCapiRelay = {
  enabled: boolean;
  process: (input: RelayInput) => RelayResult;
  pending: Set<Promise<void>>;
};

/** Node `http` adapter; resolves `false` for paths it does not own. */
export type MetaCapiHandler = ((req: IncomingMessage, res: ServerResponse) => Promise<boolean>) & {
  pending: Set<Promise<void>>;
};

/** Canonical relay path (trailing slash: the standalone target redirects the slash-less form). */
export const META_CAPI_PATH = "/api/meta/events/";
export const GRAPH_API_VERSION = "v26.0";
export const MAX_BODY_BYTES = 16 * 1024;
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
  readonly reason: string;
  constructor(reason: string) {
    super(reason);
    this.reason = reason;
  }
}

function isShortString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateEvent(raw: unknown, origins: Set<string>, now: number): RelayEvent {
  if (!isPlainObject(raw)) throw new ValidationError("event");
  const { name, eventId, time, sourceUrl, params, fbp, fbc } = raw;
  if (typeof name !== "string" || FORBIDDEN_EVENTS.has(name) || !ALLOWED_EVENTS.has(name))
    throw new ValidationError("name");
  if (typeof eventId !== "string" || !UUID_V4.test(eventId)) throw new ValidationError("eventId");
  if (typeof time !== "number" || !Number.isFinite(time)) throw new ValidationError("time");
  if (!isShortString(sourceUrl, MAX_URL)) throw new ValidationError("sourceUrl");
  let origin: string;
  try {
    origin = new URL(sourceUrl).origin;
  } catch {
    throw new ValidationError("sourceUrl");
  }
  if (!origins.has(origin)) throw new ValidationError("sourceUrl");
  const clean: Record<string, string | number> = {};
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
    sourceUrl,
    params: clean,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };
}

function validateBody(body: unknown, origins: Set<string>, now: number): RelayEvent[] {
  if (!isPlainObject(body) || !Array.isArray(body.events)) throw new ValidationError("events");
  if (body.events.length < 1 || body.events.length > MAX_EVENTS) throw new ValidationError("events");
  return body.events.map((event) => validateEvent(event, origins, now));
}

function parseOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Token bucket per client IP. */
class RateLimiter {
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private readonly now: () => number;
  private readonly buckets = new Map<string, { tokens: number; at: number }>();

  constructor(config: { events: number; windowMs: number }, now: () => number) {
    this.capacity = config.events;
    this.refillPerMs = config.events / config.windowMs;
    this.now = now;
  }

  take(key: string, cost: number): boolean {
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

  private prune(at: number): void {
    const stale = this.capacity / this.refillPerMs;
    for (const [key, bucket] of this.buckets) if (at - bucket.at > stale) this.buckets.delete(key);
  }
}

/**
 * Client IP from the first candidate that is a plain IPv4/IPv6 address (`::ffff:` prefix
 * stripped). Callers pass `cf-connecting-ip`, the first `x-forwarded-for` entry, then a socket
 * address when they have one.
 */
export function pickClientIp(candidates: ReadonlyArray<string | undefined | null>): string {
  for (const raw of candidates) {
    const [first = ""] = (raw || "").split(",");
    const value = first.trim().replace(/^::ffff:/i, "");
    if (value && isIP(value)) return value;
  }
  return "";
}

function allowedOrigins(host: string | undefined, siteOrigin: string | null): Set<string> {
  const origins = new Set(siteOrigin ? [siteOrigin] : []);
  if (typeof host === "string" && /^[a-z0-9.:[\]-]+$/i.test(host)) {
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }
  return origins;
}

function result(status: number, reason?: string): RelayResult {
  if (reason === undefined) return { status, headers: { ...NO_STORE } };
  return {
    status,
    headers: { ...NO_STORE, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ error: reason }),
  };
}

/**
 * Handler options from the process environment: `NEXT_PUBLIC_META_PIXEL_ID` (shared with the
 * browser pixel), the server-only `META_CAPI_ACCESS_TOKEN` and `NEXT_PUBLIC_SITE_URL`.
 */
export function metaCapiOptionsFromEnv(env: Readonly<Record<string, string | undefined>>): {
  pixelId: string;
  accessToken: string;
  siteUrl: string;
} {
  return {
    pixelId: (env.NEXT_PUBLIC_META_PIXEL_ID || "").trim(),
    accessToken: (env.META_CAPI_ACCESS_TOKEN || "").trim(),
    siteUrl: (env.NEXT_PUBLIC_SITE_URL || "").trim(),
  };
}

/**
 * Transport-agnostic relay: `process(input)` validates one request and describes the response;
 * a valid batch is forwarded to Graph API in the background (bearer token header, 3 s timeout,
 * one retry on 429/5xx/network error) and its promise is kept in `pending`. With an empty
 * `pixelId` or `accessToken` every valid request gets `204` and Meta is never called. Used by
 * the Node adapter below (static server) and by the standalone route handler.
 */
export function createMetaCapiRelay(options: RelayOptions): MetaCapiRelay {
  const {
    pixelId,
    accessToken,
    siteUrl = "",
    fetchImpl = fetch,
    now = Date.now,
    log = (line) => console.error(line),
    onResult,
    rateLimit = { events: 60, windowMs: 60_000 },
    timeoutMs = 3000,
  } = options;
  const enabled = Boolean(pixelId) && Boolean(accessToken);
  const siteOrigin = parseOrigin(siteUrl);
  const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events`;
  const limiter = new RateLimiter(rateLimit, now);
  const pending = new Set<Promise<void>>();

  function payload(events: RelayEvent[], ip: string, userAgent: string) {
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

  async function post(body: string): Promise<{ status: number; detail: string }> {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    let detail = "";
    if (!response.ok) {
      try {
        const json = (await response.json()) as { error?: { code?: number; fbtrace_id?: string } } | null;
        const code = json?.error?.code;
        const trace = json?.error?.fbtrace_id;
        detail = `${code !== undefined ? ` code=${code}` : ""}${trace ? ` fbtrace=${trace}` : ""}`;
      } catch {
        detail = "";
      }
    }
    return { status: response.status, detail };
  }

  async function relay(body: string): Promise<void> {
    let attempts = 0;
    let last: { status: number; detail: string } | null = null;
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

  function process(input: RelayInput): RelayResult {
    if (input.method !== "POST") return { status: 405, headers: { ...NO_STORE, Allow: "POST" } };
    const origins = allowedOrigins(input.host, siteOrigin);
    if (input.origin && !origins.has(input.origin)) return result(403, "origin");
    if (!enabled) return result(204);
    if (!/^application\/json\b/i.test(input.contentType || "")) return result(415, "content-type");
    if (Buffer.byteLength(input.bodyText, "utf8") > MAX_BODY_BYTES) return result(413, "size");
    let events: RelayEvent[];
    try {
      events = validateBody(JSON.parse(input.bodyText), origins, now());
    } catch (error) {
      return result(400, error instanceof ValidationError ? error.reason : "json");
    }
    const ip = input.ip || "";
    if (!limiter.take(ip || "unknown", events.length)) return result(429, "rate");
    const body = JSON.stringify(payload(events, ip, input.userAgent || ""));
    const job = relay(body).finally(() => pending.delete(job));
    pending.add(job);
    return result(202);
  }

  return { enabled, process, pending };
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
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

function write(res: ServerResponse, outcome: RelayResult): void {
  res.writeHead(outcome.status, outcome.headers);
  res.end(outcome.body);
}

function header(headers: IncomingMessage["headers"], name: string): string | undefined {
  const value = headers[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Node `http` adapter for the static server: `(req, res) => Promise<boolean>` that answers
 * `/api/meta/events/` (slash-less form accepted) and returns `false` for any other path so the
 * caller continues. `handler.pending` is the relay's set of upstream promises.
 */
export function createMetaCapiHandler(options: RelayOptions): MetaCapiHandler {
  const relay = createMetaCapiRelay(options);
  const handler: MetaCapiHandler = Object.assign(
    async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
      const pathname = (req.url || "/").split("?")[0];
      if (pathname !== META_CAPI_PATH && `${pathname}/` !== META_CAPI_PATH) return false;
      const base = {
        method: req.method || "GET",
        contentType: header(req.headers, "content-type"),
        origin: header(req.headers, "origin"),
        host: header(req.headers, "host"),
        ip: pickClientIp([
          header(req.headers, "cf-connecting-ip"),
          header(req.headers, "x-forwarded-for"),
          req.socket?.remoteAddress,
        ]),
        userAgent: header(req.headers, "user-agent"),
      };
      if (req.method !== "POST" || !relay.enabled) {
        req.resume();
        write(res, relay.process({ ...base, bodyText: "" }));
        return true;
      }
      if (Number(req.headers["content-length"] || 0) > MAX_BODY_BYTES) {
        req.resume();
        write(res, result(413, "size"));
        return true;
      }
      let bodyText: string;
      try {
        bodyText = await readBody(req, MAX_BODY_BYTES);
      } catch (error) {
        write(res, error instanceof ValidationError ? result(413, error.reason) : result(400, "body"));
        return true;
      }
      write(res, relay.process({ ...base, bodyText }));
      return true;
    },
    { pending: relay.pending },
  );
  return handler;
}
