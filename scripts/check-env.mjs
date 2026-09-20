// @ts-check
// Validates the NEXT_PUBLIC_* variables a build inlines and the server-only Meta CAPI token
// (presence and formats only, never values) and prints the effective tracking configuration.
// Runs first in `npm run build`; exits 1 when a required variable is missing or malformed.
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

/**
 * Variables every build needs. The repository ships no inline defaults for them: copy
 * `.env.example` to `.env.local` for a local build; hPanel and the workflows set them.
 * @returns {string[]}
 */
function validate() {
  const errors = [];
  const siteUrl = read("NEXT_PUBLIC_SITE_URL");
  if (!siteUrl) errors.push("NEXT_PUBLIC_SITE_URL is required (https:// origin of the deployment)");
  else if (!isHttpsUrl(siteUrl)) errors.push("NEXT_PUBLIC_SITE_URL must be an https:// origin");

  const checkoutNames = ["NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO", "NEXT_PUBLIC_CHECKOUT_URL"];
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

  return errors;
}

function summary() {
  const meta = read("NEXT_PUBLIC_META_PIXEL_ID") ? "on" : "off";
  const capi = meta === "on" && read("META_CAPI_ACCESS_TOKEN") ? "on" : "off";
  return `tracking: meta=${meta} capi=${capi}`;
}

loadEnvFiles();
const errors = validate();
if (errors.length > 0) {
  for (const error of errors) console.error(`check-env: ${error}`);
  process.exit(1);
}
console.log(summary());
