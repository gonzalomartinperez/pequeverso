// @ts-check
// Validates the NEXT_PUBLIC_* variables a build inlines (formats only, never values) and prints
// the effective tracking configuration. Runs first in `npm run build`; exits 1 on a malformed value.
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

/** @param {string} name */
function read(name) {
  return (process.env[name] || "").trim();
}

/** @param {string} value */
function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** @returns {string[]} */
function validate() {
  const errors = [];
  const siteUrl = read("NEXT_PUBLIC_SITE_URL");
  if (siteUrl && !isHttpsUrl(siteUrl)) errors.push("NEXT_PUBLIC_SITE_URL must be an https:// origin");

  for (const name of ["NEXT_PUBLIC_CHECKOUT_URL", "NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO"]) {
    const value = read(name);
    if (value && !value.startsWith(CHECKOUT_ORIGIN))
      errors.push(`${name} must start with ${CHECKOUT_ORIGIN}`);
  }

  const pixel = read("NEXT_PUBLIC_META_PIXEL_ID");
  if (pixel && !/^\d{15,16}$/.test(pixel)) errors.push("NEXT_PUBLIC_META_PIXEL_ID must be 15-16 digits");

  const umamiUrl = read("NEXT_PUBLIC_UMAMI_SCRIPT_URL");
  const umamiId = read("NEXT_PUBLIC_UMAMI_WEBSITE_ID");
  if (Boolean(umamiUrl) !== Boolean(umamiId)) {
    errors.push("NEXT_PUBLIC_UMAMI_SCRIPT_URL and NEXT_PUBLIC_UMAMI_WEBSITE_ID must be set together");
  }
  if (umamiUrl && !isHttpsUrl(umamiUrl)) errors.push("NEXT_PUBLIC_UMAMI_SCRIPT_URL must be an https:// URL");

  const mode = read("NEXT_PUBLIC_CONSENT_MODE");
  if (mode && mode !== "strict" && mode !== "advanced") {
    errors.push('NEXT_PUBLIC_CONSENT_MODE must be "strict" or "advanced"');
  }

  const debug = read("NEXT_PUBLIC_TRACKING_DEBUG");
  if (debug && debug !== "0" && debug !== "1") errors.push('NEXT_PUBLIC_TRACKING_DEBUG must be "1" or empty');

  return errors;
}

function summary() {
  const meta = read("NEXT_PUBLIC_META_PIXEL_ID") ? "on" : "off";
  const umami = read("NEXT_PUBLIC_UMAMI_SCRIPT_URL") && read("NEXT_PUBLIC_UMAMI_WEBSITE_ID") ? "on" : "off";
  const mode = read("NEXT_PUBLIC_CONSENT_MODE") === "advanced" ? "advanced" : "strict";
  return `tracking: meta=${meta} umami=${umami} mode=${mode}`;
}

loadEnvFiles();
const errors = validate();
if (errors.length > 0) {
  for (const error of errors) console.error(`check-env: ${error}`);
  process.exit(1);
}
console.log(summary());
