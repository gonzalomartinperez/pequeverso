// Validates the NEXT_PUBLIC_* variables a build inlines and the server-only Meta CAPI token
// (presence and formats only, never values) and prints the effective tracking configuration.
// Runs first in `npm run build`; exits 1 when a required variable is missing or malformed.
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAnalyticsEnv } from "../config/site-analytics-env.ts";
import { parseAssistantEnv } from "../src/features/assistant/flag.ts";
import { affiliateEnvNames, affiliateSources, isAffiliateUrl } from "./lib/edge-rules.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKOUT_ORIGIN = "https://pay.hotmart.com/";

/** Same precedence as Next.js: existing process.env wins, then the most specific file. */
function loadEnvFiles() {
  const stage = process.env.NODE_ENV || "production";
  for (const name of [`.env.${stage}.local`, ".env.local", `.env.${stage}`, ".env"]) {
    const file = resolve(root, name);
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

function read(name: string): string {
  return (process.env[name] || "").trim();
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Variables every build needs. The repository ships no inline defaults for them: copy
 * `.env.example` to `.env.local` for a local build; hPanel and the workflows set them.
 */
function validate(): string[] {
  const errors: string[] = [];
  const siteUrl = read("NEXT_PUBLIC_SITE_URL");
  if (!siteUrl) errors.push("NEXT_PUBLIC_SITE_URL is required (https:// origin of the deployment)");
  else if (!isHttpsUrl(siteUrl)) errors.push("NEXT_PUBLIC_SITE_URL must be an https:// origin");

  const checkoutNames = ["NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO", "NEXT_PUBLIC_CHECKOUT_URL"] as const;
  if (!checkoutNames.some((name) => read(name))) {
    errors.push(`${checkoutNames[0]} is required (the Hotmart checkout URL of the principal product)`);
  }
  for (const name of checkoutNames) {
    const value = read(name);
    if (value && !value.startsWith(CHECKOUT_ORIGIN))
      errors.push(`${name} must start with ${CHECKOUT_ORIGIN}`);
  }

  const pixel = read("NEXT_PUBLIC_META_PIXEL_ID");
  if (pixel && !/^\d{15,16}$/.test(pixel)) errors.push("NEXT_PUBLIC_META_PIXEL_ID must be 15-16 digits");

  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (token !== undefined && token !== "" && (token.length < 32 || /\s/.test(token)))
    errors.push("META_CAPI_ACCESS_TOKEN must be at least 32 characters without whitespace");

  for (const name of affiliateNames()) {
    if (!isAffiliateUrl(read(name)))
      errors.push(`${name} must be a plain https:// affiliate link (no spaces, quotes or $)`);
  }

  const assistant = assistantFlag();
  if (!assistant.ok) errors.push(...assistant.errors);

  try {
    parseAnalyticsEnv({
      enabled: process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED,
      apiOrigin: process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_API_ORIGIN,
      localTestBuild: process.env.PRODUCT_ANALYTICS_LOCAL_TEST_BUILD,
    });
  } catch {
    errors.push("Product analytics requires a valid flag and bare API origin");
  }
  return errors;
}

/** Affiliate redirect destinations that are set (config/edge-rules.json `destinationEnv`). */
function affiliateNames(): string[] {
  return affiliateEnvNames().filter((name) => read(name));
}

/** The native assistant is disabled unless explicitly enabled (src/features/assistant/flag.ts). */
function assistantFlag() {
  return parseAssistantEnv({
    enabled: process.env.NEXT_PUBLIC_ASSISTANT_ENABLED,
    apiOrigin: process.env.NEXT_PUBLIC_ASSISTANT_API_ORIGIN,
    localTestBuild: process.env.ASSISTANT_LOCAL_TEST_BUILD,
  });
}

function summary(): string {
  const meta = read("NEXT_PUBLIC_META_PIXEL_ID") ? "on" : "off";
  const capi = meta === "on" && read("META_CAPI_ACCESS_TOKEN") ? "on" : "off";
  const result = assistantFlag();
  const assistant =
    result.ok && result.flag.enabled
      ? "ENABLED (verification build: not authorized for publication)"
      : "disabled";
  const affiliates = affiliateNames().length;
  return `tracking: meta=${meta} capi=${capi}\nassistant: ${assistant}\naffiliate redirects: ${affiliates}`;
}

loadEnvFiles();
const errors = validate();
if (errors.length > 0) {
  for (const error of errors) console.error(`check-env: ${error}`);
  process.exit(1);
}
console.log(summary());
// The home block links to every affiliate path; without its variable the path answers 404.
const unsetAffiliates = affiliateEnvNames().filter((name) => !read(name));
if (unsetAffiliates.length > 0)
  console.warn(
    `check-env: warning: ${unsetAffiliates.join(", ")} empty: ${affiliateSources().join(", ")} will 404 (set it for a publishable build; docs/affiliates.md)`,
  );
