// Proves a build ships WITHOUT the state gallery (`/_design`, docs/design-system.md): no route,
// HTML file, directory, chunk or gallery-only marker string in the emitted output. `npm run build`
// runs it as a last step with --allow-enabled (a build made with NEXT_PUBLIC_DESIGN_GALLERY=true
// only prints a warning); CI and `check:design-gallery-disabled` run it strictly. Usage:
//   node tools/check-design-gallery-disabled.ts [--allow-enabled] [dir]
// Without a dir it scans out/ (export) or .next (standalone: static, server, manifests and the
// traced standalone copy), following public/build-info.json.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const allowEnabled = args.includes("--allow-enabled");
const explicit = args.find((arg) => !arg.startsWith("--"));
const TEXT = /\.(html|js|mjs|css|json|txt|map|xml|webmanifest|htaccess|rsc|nft)$|^\.htaccess$/;
const SKIPPED_DIRS = new Set(["node_modules", "cache"]);

/** Strings only the gallery emits (keep in sync with src/views/design-gallery-view.tsx). */
const MARKERS = [
  "pv-design-gallery",
  "Design state gallery",
  "gallery-sticky-sentinel",
  "data-gallery-block",
  "/_design",
  "%5Fdesign",
];
const PATH_MARKER = /^(_design|%5Fdesign)(\.|$)/;

function buildOutput(): string | undefined {
  try {
    const info = JSON.parse(readFileSync(resolve("public/build-info.json"), "utf8")) as {
      output?: unknown;
    };
    return typeof info.output === "string" ? info.output : undefined;
  } catch {
    return undefined;
  }
}

function walk(root: string, visit: (path: string, name: string, directory: boolean) => void) {
  for (const entry of readdirSync(root)) {
    if (SKIPPED_DIRS.has(entry)) continue;
    const full = join(root, entry);
    const directory = statSync(full).isDirectory();
    visit(full, entry, directory);
    if (directory) walk(full, visit);
  }
}

const roots = explicit
  ? [resolve(explicit)]
  : buildOutput() === "standalone"
    ? [resolve(".next/static"), resolve(".next/server"), resolve(".next/standalone/.next")]
    : [resolve("out")];
const manifests =
  !explicit && buildOutput() === "standalone" && existsSync(".next")
    ? readdirSync(".next")
        .filter((name) => name.endsWith(".json"))
        .map((name) => resolve(".next", name))
    : [];

const failures: string[] = [];
let scanned = 0;
const present = roots.filter((root) => existsSync(root));
if (present.length === 0) failures.push("no build output found to scan");

function inspect(file: string) {
  scanned++;
  const text = readFileSync(file, "utf8");
  for (const marker of MARKERS)
    if (text.includes(marker))
      failures.push(`${relative(process.cwd(), file)} contains a gallery marker (${marker})`);
}

for (const root of present)
  walk(root, (path, name, directory) => {
    if (PATH_MARKER.test(name))
      failures.push(
        `${relative(process.cwd(), path)} is a gallery ${directory ? "directory" : "file"}`,
      );
    else if (!directory && TEXT.test(name)) inspect(path);
  });
for (const file of manifests) inspect(file);

if (present.length > 0 && scanned === 0) failures.push("no build output found to scan");

if (failures.length && allowEnabled && process.env.NEXT_PUBLIC_DESIGN_GALLERY?.trim() === "true") {
  console.warn(
    "check-design-gallery-disabled: gallery ENABLED build (verification only): NOT publishable",
  );
  process.exit(0);
}
if (failures.length) {
  for (const failure of new Set(failures))
    console.error(`check-design-gallery-disabled: ${failure}`);
  console.error(
    "check-design-gallery-disabled: this artifact includes the state gallery and is NOT publishable",
  );
  process.exit(1);
}
console.log(
  `check-design-gallery-disabled: ${scanned} files in ${present.map((root) => relative(process.cwd(), root) || ".").join(", ")} carry no gallery code`,
);
