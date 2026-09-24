import {
  createMetaCapiRelay,
  MAX_BODY_BYTES,
  type MetaCapiRelay,
  metaCapiOptionsFromEnv,
  pickClientIp,
} from "@server/meta-capi.mjs";

/**
 * Meta Conversions API relay for the standalone target (`POST /api/meta/events/`). The file
 * exists only in standalone builds: `next.config.mjs` adds the `standalone.ts` page extension
 * there and the static export ignores it (a POST handler breaks `output: "export"`). The
 * validation, dedup payload and upstream call live in `server/meta-capi.mjs`; environment is
 * read at request time so the token never enters a build.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

let relay: MetaCapiRelay | null = null;
let relayKey = "";

function currentRelay(): MetaCapiRelay {
  const options = metaCapiOptionsFromEnv(process.env);
  const key = `${options.pixelId}\n${options.accessToken}\n${options.siteUrl}`;
  if (!relay || key !== relayKey) {
    relay = createMetaCapiRelay(options);
    relayKey = key;
  }
  return relay;
}

function toResponse(outcome: { status: number; headers: Record<string, string>; body?: string }): Response {
  return new Response(outcome.body ?? null, { status: outcome.status, headers: outcome.headers });
}

export async function POST(request: Request): Promise<Response> {
  const headers = request.headers;
  const base = {
    method: "POST",
    contentType: headers.get("content-type") ?? undefined,
    origin: headers.get("origin") ?? undefined,
    host: headers.get("host") ?? undefined,
    ip: pickClientIp([headers.get("cf-connecting-ip"), headers.get("x-forwarded-for")]),
    userAgent: headers.get("user-agent") ?? undefined,
  };
  const active = currentRelay();
  if (!active.enabled) return toResponse(active.process({ ...base, bodyText: "" }));
  if (Number(headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ error: "size" }, { status: 413, headers: NO_STORE });
  }
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return Response.json({ error: "body" }, { status: 400, headers: NO_STORE });
  }
  return toResponse(active.process({ ...base, bodyText }));
}

function methodNotAllowed(): Response {
  return new Response(null, { status: 405, headers: { ...NO_STORE, Allow: "POST" } });
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as HEAD,
  methodNotAllowed as OPTIONS,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT,
};
