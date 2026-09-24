import type { IncomingMessage, ServerResponse } from "node:http";

export const META_CAPI_PATH: "/api/meta/events/";
export const GRAPH_API_VERSION: string;
export const MAX_BODY_BYTES: number;

export type UpstreamResult = { status: number; ok: boolean; attempts: number };

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

export type RelayInput = {
  method: string;
  bodyText: string;
  contentType?: string;
  origin?: string;
  host?: string;
  ip?: string;
  userAgent?: string;
};

export type RelayResult = { status: number; headers: Record<string, string>; body?: string };

export type MetaCapiRelay = {
  enabled: boolean;
  process: (input: RelayInput) => RelayResult;
  pending: Set<Promise<void>>;
};

export type MetaCapiHandler = ((req: IncomingMessage, res: ServerResponse) => Promise<boolean>) & {
  pending: Set<Promise<void>>;
};

export function pickClientIp(candidates: Array<string | undefined | null>): string;
export function metaCapiOptionsFromEnv(env: NodeJS.ProcessEnv): {
  pixelId: string;
  accessToken: string;
  siteUrl: string;
};
export function createMetaCapiRelay(options: RelayOptions): MetaCapiRelay;
export function createMetaCapiHandler(options: RelayOptions): MetaCapiHandler;
