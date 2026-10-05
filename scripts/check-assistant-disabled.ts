// Proves a built export ships WITHOUT the native assistant: build-info.json says "disabled" and no
// emitted file contains an assistant marker (chunk, copy, API path, header names or configured
// origin). Only artifacts that pass are publishable. `npm run build` runs it as its last step with
// --allow-enabled (an explicitly enabled verification build only prints a warning); CI and
// `check:assistant-disabled` run it strictly. Usage:
//   node scripts/check-assistant-disabled.ts [--allow-enabled] [dir]
// Without a dir it scans out/ (export) or .next/static + .next/server/app (standalone), following
// public/build-info.json.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const allowEnabled = args.includes("--allow-enabled");
const explicit = args.find((arg) => !arg.startsWith("--"));
const buildInfo = (path: string): { assistant?: unknown; output?: unknown } | null => {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as { assistant?: unknown; output?: unknown };
  } catch {
    return null;
  }
};
const standalone = !explicit && buildInfo(resolve("public/build-info.json"))?.output === "standalone";
const dirs = explicit
  ? [resolve(explicit)]
  : standalone
    ? [resolve(".next/static"), resolve(".next/server/app")]
    : [resolve("out")];
const dir = dirs[0] ?? resolve("out");
const TEXT = /\.(html|js|mjs|css|json|txt|map|xml|webmanifest|htaccess)$|^\.htaccess$/;

/** Strings that only the assistant code emits (keep in sync with src/features/assistant). */
const MARKERS = [
  "pv-assistant-panel",
  "assistant-launcher",
  "/api/v1/session",
  "/api/v1/messages",
  "Idempotency-Key",
  "X-CSRF-Token",
  "Asistente Pequeverso",
  "Abrir el asistente de Pequeverso",
];

function files(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else if (TEXT.test(entry)) out.push(full);
  }
  return out;
}

const failures: string[] = [];
const info = buildInfo(standalone ? resolve("public/build-info.json") : join(dir, "build-info.json"));
if (!info) failures.push("build-info.json is missing or unreadable");
else if (info.assistant === "enabled" && allowEnabled) {
  console.warn("check-assistant-disabled: assistant ENABLED build (verification only): NOT publishable");
  process.exit(0);
} else if (info.assistant !== "disabled")
  failures.push('build-info.json does not record assistant: "disabled"');

const origin = (process.env.NEXT_PUBLIC_ASSISTANT_API_ORIGIN ?? "").trim();
const markers = origin ? [...MARKERS, origin] : MARKERS;
const scanned = dirs.filter((path) => existsSync(path)).flatMap((path) => files(path));
if (scanned.length === 0) failures.push("no build output found to scan");
for (const file of scanned) {
  const text = readFileSync(file, "utf8");
  for (const marker of markers)
    if (text.includes(marker))
      failures.push(
        `${relative(process.cwd(), file)} contains an assistant marker${marker === origin ? " (API origin)" : ""}`,
      );
}

if (failures.length) {
  for (const failure of new Set(failures)) console.error(`check-assistant-disabled: ${failure}`);
  console.error("check-assistant-disabled: this artifact includes the assistant and is NOT publishable");
  process.exit(1);
}
console.log(
  `check-assistant-disabled: ${scanned.length} files in ${relative(process.cwd(), dir) || "."} carry no assistant code`,
);
