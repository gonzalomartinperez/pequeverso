import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const EDGE_RULES_PATH = resolve(here, "../../config/edge-rules.json");

type RedirectRule = {
  id: string;
  source: string;
  destination?: string;
  /**
   * Affiliate redirects: name of the build-time variable holding the destination (a Hotmart
   * affiliate link). The repository never ships the link itself (AGENTS.md: deployment values
   * live in environment variables). Unset variable → the rule is skipped and the path 404s.
   */
  destinationEnv?: string;
  permanent?: boolean;
  gone?: boolean;
  description?: string;
};
type HeaderRule = { id: string; source: string; headers: Record<string, string> };

/** Shape of config/edge-rules.json. */
export type EdgeRules = {
  canonicalHost: string;
  hsts: { enabled: boolean; maxAge: number; includeSubDomains: boolean };
  redirects: RedirectRule[];
  headers: HeaderRule[];
};

type NextRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
  has?: Array<{ type: "host"; value: string }>;
};
type NextHeader = { source: string; headers: Array<{ key: string; value: string }> };

/**
 * Variables that may hold affiliate destinations (`destinationEnv`): the repository's naming
 * standard for product checkout links, `NEXT_PUBLIC_CHECKOUT_URL_<PRODUCT>`. Only the redirect reads
 * them at build time; no page references them, so nothing is inlined in the browser bundle.
 */
export const CHECKOUT_ENV_PATTERN = /^NEXT_PUBLIC_CHECKOUT_URL_[A-Z0-9_]+$/;

/** `destinationEnv` names declared in config/edge-rules.json (affiliate redirects). */
export function affiliateEnvNames(path: string = EDGE_RULES_PATH): string[] {
  const rules = JSON.parse(readFileSync(path, "utf8")) as EdgeRules;
  return rules.redirects.flatMap((rule) => (rule.destinationEnv ? [rule.destinationEnv] : []));
}

/** Affiliate redirect paths (`source` of `destinationEnv` rules): answered by the edge, not a file. */
export function affiliateSources(path: string = EDGE_RULES_PATH): string[] {
  const rules = JSON.parse(readFileSync(path, "utf8")) as EdgeRules;
  return rules.redirects.flatMap((rule) => (rule.destinationEnv ? [rule.source] : []));
}

/**
 * True when `value` is a plain https URL usable as an affiliate destination. Affiliate links may
 * land on Hotmart or on the producer's own checkout/sales page, so no host allow-list: the guard
 * is the scheme and a conservative character set (no spaces, quotes, `$`, `\\`, `<>` or braces).
 */
export function isAffiliateUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && url.hostname.includes(".") && /^[A-Za-z0-9:/._~?=&%+,#@!*-]+$/.test(value)
    );
  } catch {
    return false;
  }
}

type Env = Record<string, string | undefined>;

/**
 * Loads config/edge-rules.json and resolves `destinationEnv` rules against `env` (the build
 * environment by default). Rules whose variable is empty are dropped; a malformed value throws so
 * a broken affiliate link never ships. Pass `{}` to render the variable-free golden copy.
 */
export function loadEdgeRules(path: string = EDGE_RULES_PATH, env: Env = process.env): EdgeRules {
  const rules = JSON.parse(readFileSync(path, "utf8")) as EdgeRules;
  validateEdgeRules(rules);
  return resolveEdgeRules(rules, env);
}

export function resolveEdgeRules(rules: EdgeRules, env: Env): EdgeRules {
  const redirects: RedirectRule[] = [];
  for (const rule of rules.redirects) {
    if (!rule.destinationEnv) {
      redirects.push(rule);
      continue;
    }
    const value = (env[rule.destinationEnv] ?? "").trim();
    if (!value) continue;
    if (!isAffiliateUrl(value))
      throw new Error(
        `edge-rules: ${rule.destinationEnv} must be a plain https:// affiliate link (${rule.id})`,
      );
    redirects.push({ ...rule, destination: value });
  }
  return { ...rules, redirects };
}

export function validateEdgeRules(rules: EdgeRules): void {
  const ids = new Set<string>();
  for (const rule of [...rules.redirects, ...rules.headers]) {
    if (!rule.id || ids.has(rule.id)) throw new Error(`edge-rules: duplicate or missing id "${rule.id}"`);
    ids.add(rule.id);
    if (!rule.source.startsWith("/")) throw new Error(`edge-rules: source must start with "/" (${rule.id})`);
  }
  for (const rule of rules.redirects) {
    if (rule.destinationEnv !== undefined) {
      if (!CHECKOUT_ENV_PATTERN.test(rule.destinationEnv))
        throw new Error(
          `edge-rules: ${rule.id} destinationEnv must match NEXT_PUBLIC_CHECKOUT_URL_<PRODUCT>`,
        );
      if (rule.destination || rule.gone || rule.permanent !== false)
        throw new Error(`edge-rules: ${rule.id} (affiliate) must be temporary and have no destination/gone`);
      continue;
    }
    if (!rule.gone && !rule.destination)
      throw new Error(`edge-rules: redirect ${rule.id} needs a destination or gone:true`);
    if (rule.destination?.startsWith(rule.source) && rule.source.endsWith("*")) {
      throw new Error(`edge-rules: redirect ${rule.id} would loop`);
    }
  }
}

/** Next.js redirects() shape (standalone target). */
export function toNextRedirects(rules: EdgeRules): NextRedirect[] {
  const list: NextRedirect[] = rules.redirects
    .filter((r) => !r.gone)
    .map((r) => ({
      source: r.source,
      destination: r.destination ?? "",
      permanent: r.permanent !== false,
    }));
  // www → apex on the Node target (the static target does it in .htaccess).
  const host: NextRedirect["has"] = [{ type: "host", value: `www.${rules.canonicalHost}` }];
  list.unshift(
    { source: "/", has: host, destination: `https://${rules.canonicalHost}`, permanent: true },
    { source: "/:path+", has: host, destination: `https://${rules.canonicalHost}/:path+/`, permanent: true },
  );
  return list;
}

/** Next.js headers() shape (standalone target). */
export function toNextHeaders(rules: EdgeRules): NextHeader[] {
  const list: NextHeader[] = rules.headers.map((h) => ({
    source: h.source,
    headers: Object.entries(h.headers).map(([key, value]) => ({ key, value })),
  }));
  if (rules.hsts.enabled) {
    list.unshift({
      source: "/:path*",
      headers: [{ key: "Strict-Transport-Security", value: hstsValue(rules.hsts) }],
    });
  }
  return list;
}

export function hstsValue(hsts: EdgeRules["hsts"]): string {
  return `max-age=${hsts.maxAge}${hsts.includeSubDomains ? "; includeSubDomains" : ""}`;
}

/**
 * Convert a Next.js-style path pattern into an Apache regex fragment (per-directory
 * context: no leading slash). Supports literal paths and a trailing `:name*` segment.
 */
export function toApacheRegex(source: string): string {
  const trimmed = source.replace(/^\//, "");
  const escaped = trimmed.replace(/[.+?^${}()|[\]\\]/g, (m) => `\\${m}`);
  if (/:[a-zA-Z0-9_]+\*$/.test(trimmed)) {
    return `^${escaped.replace(/:[a-zA-Z0-9_]+\*$/, "(.*)")}$`;
  }
  if (/\*$/.test(trimmed)) return `^${escaped.replace(/\\?\*$/, "(.*)")}$`;
  // Literal paths accept the slash-less form too (one hop instead of slash → alias → target).
  return `^${escaped.replace(/\/$/, "/?")}$`;
}

/**
 * Convert a header-rule source into an Apache <If> expression on the request path.
 */
export function toApacheIfExpression(source: string): string | null {
  if (source === "/:path*") return null; // applies to everything
  const regex = source
    .replace(/^\//, "")
    .replace(/[.+?^${}()|[\]\\]/g, (m) => `\\${m}`)
    .replace(/:[a-zA-Z0-9_]+\*/g, ".*");
  return `%{REQUEST_URI} =~ m#^/${regex}$#`;
}

/** Render the .htaccess for the static target. */
export function toHtaccess(rules: EdgeRules, opts: { buildId?: string } = {}): string {
  const lines: string[] = [];
  lines.push("# Generated by scripts/gen-htaccess.ts from config/edge-rules.json — do not edit by hand.");
  if (opts.buildId) lines.push(`# build ${opts.buildId}`);
  lines.push("");
  lines.push("Options -Indexes");
  lines.push("DirectorySlash On");
  lines.push("AddDefaultCharset utf-8");
  lines.push("ErrorDocument 404 /404.html");
  lines.push("");
  lines.push("<IfModule mod_rewrite.c>");
  lines.push("RewriteEngine On");
  lines.push("# Never serve dotfiles (the deploy branch is pulled with its .git directory).");
  lines.push("RewriteRule (^|/)\\.(?!well-known/) - [R=404,L]");
  lines.push("# Canonical host and scheme in one hop.");
  lines.push(`RewriteCond %{HTTP_HOST} ^www\\.${rules.canonicalHost.replace(/\./g, "\\.")}$ [NC]`);
  lines.push(`RewriteRule ^(.*)$ https://${rules.canonicalHost}/$1 [R=301,L]`);
  lines.push("RewriteCond %{HTTPS} !=on");
  lines.push("RewriteCond %{HTTP:X-Forwarded-Proto} !=https");
  lines.push(`RewriteRule ^(.*)$ https://${rules.canonicalHost}/$1 [R=301,L]`);
  for (const r of rules.redirects) {
    lines.push(`# ${r.id}${r.description ? `: ${r.description}` : ""}`);
    if (r.gone) {
      lines.push(`RewriteRule ${toApacheRegex(r.source)} - [G,L]`);
    } else {
      // `%` would read as a RewriteCond back-reference in the substitution: escape it.
      const dest = (r.destination ?? "").replace(/:[a-zA-Z0-9_]+\*/g, "$1").replace(/%/g, "\\%");
      // Affiliate links keep the visitor's query (?src=… reaches Hotmart) even when they carry their own.
      const flags = `R=${r.permanent === false ? 302 : 301},L${r.destinationEnv ? ",QSA,NE" : ""}`;
      lines.push(`RewriteRule ${toApacheRegex(r.source)} ${dest} [${flags}]`);
    }
  }
  lines.push("</IfModule>");
  lines.push("");
  lines.push("<IfModule mod_headers.c>");
  if (rules.hsts.enabled) {
    lines.push(`Header always set Strict-Transport-Security "${hstsValue(rules.hsts)}" env=HTTPS`);
  }
  for (const h of rules.headers) {
    const expr = toApacheIfExpression(h.source);
    lines.push(`# ${h.id}`);
    if (expr) lines.push(`<If "${expr}">`);
    for (const [key, value] of Object.entries(h.headers)) {
      lines.push(`${expr ? "  " : ""}Header always set ${key} "${value.replace(/"/g, '\\"')}"`);
    }
    if (expr) lines.push("</If>");
  }
  lines.push("</IfModule>");
  lines.push("");
  lines.push("<IfModule mod_mime.c>");
  lines.push("AddType font/woff2 .woff2");
  lines.push("AddType image/webp .webp");
  lines.push("AddType image/avif .avif");
  lines.push("AddType video/mp4 .mp4");
  lines.push("AddType video/webm .webm");
  lines.push("AddType application/manifest+json .webmanifest");
  lines.push("</IfModule>");
  lines.push("");
  return `${lines.join("\n")}\n`;
}
