// Proves a built export ships WITHOUT the native assistant: build-info.json says "disabled" and no
// emitted file contains an assistant marker (chunk, copy, API path, header names or configured
// origin). Run after `npm run build`; only artifacts that pass are publishable. Usage:
//   node scripts/check-assistant-disabled.ts [dir=out]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const dir = resolve(process.argv[2] ?? "out");
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
let info: { assistant?: unknown } = {};
try {
  info = JSON.parse(readFileSync(join(dir, "build-info.json"), "utf8")) as { assistant?: unknown };
} catch {
  failures.push("build-info.json is missing or unreadable");
}
if (info.assistant !== "disabled") failures.push('build-info.json does not record assistant: "disabled"');

const origin = (process.env.NEXT_PUBLIC_ASSISTANT_API_ORIGIN ?? "").trim();
const markers = origin ? [...MARKERS, origin] : MARKERS;
const scanned = files(dir);
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
