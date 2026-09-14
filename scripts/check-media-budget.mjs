// @ts-check
// Guards the public repository against heavy or undocumented media:
// - every file under public/media must have a record in media/manifest.json
// - no single media file above MAX_FILE_BYTES, no group (folder under public/media, the
//   manifest item's `group`) above MAX_GROUP_BYTES, total media under MAX_TOTAL_BYTES
// - no source/original formats (psd, ai, mov, 4k masters) slip in
// - with --strict (deploy workflow): every item must have rights.redistribution =
//   "public-repo-approved" — assets still pending the owner's confirmation block a release
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const strict = process.argv.includes("--strict");
const root = process.cwd();
const mediaDir = resolve(root, "public/media");
const manifestPath = resolve(root, "media/manifest.json");
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_GROUP_BYTES = 9 * 1024 * 1024;
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;
const FORBIDDEN_EXT = new Set([".psd", ".ai", ".mov", ".tif", ".tiff", ".pdf", ".zip", ".sql"]);

const toPosix = (p) => p.split("\\").join("/");
const mb = (bytes) => (bytes / 1048576).toFixed(2);

/** Group of a manifest item: its declared `group`, else the folder under public/media of its outputs. */
function groupOf(item) {
  if (item.group) return item.group;
  const file = toPosix(item.outputs?.[0]?.file ?? "");
  const match = file.match(/^public\/media\/([^/]+)\//);
  return match ? match[1] : "root";
}

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(mediaDir);
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { items: [] };
const declared = new Set();
const groupOfFile = new Map();
for (const item of manifest.items || []) {
  for (const output of item.outputs || []) {
    declared.add(toPosix(output.file));
    groupOfFile.set(toPosix(output.file), groupOf(item));
  }
}

const errors = [];
const groupTotals = new Map();
let total = 0;
for (const file of files) {
  const rel = toPosix(relative(root, file));
  const size = statSync(file).size;
  total += size;
  const group = groupOfFile.get(rel) ?? "undeclared";
  groupTotals.set(group, (groupTotals.get(group) ?? 0) + size);
  const ext = rel.slice(rel.lastIndexOf(".")).toLowerCase();
  if (FORBIDDEN_EXT.has(ext)) errors.push(`forbidden format: ${rel}`);
  if (size > MAX_FILE_BYTES) errors.push(`too large (${mb(size)} MB): ${rel}`);
  if (!declared.has(rel)) errors.push(`missing manifest record: ${rel}`);
}
for (const rel of declared) {
  if (!existsSync(resolve(root, rel))) errors.push(`manifest references missing file: ${rel}`);
}
if (strict) {
  for (const item of manifest.items || []) {
    if (item.rights?.redistribution !== "public-repo-approved") {
      errors.push(`rights not confirmed (${item.rights?.redistribution ?? "missing"}): ${item.id}`);
    }
  }
}
for (const [group, bytes] of groupTotals) {
  if (bytes > MAX_GROUP_BYTES)
    errors.push(`group "${group}" ${mb(bytes)} MB exceeds ${mb(MAX_GROUP_BYTES)} MB`);
}
if (total > MAX_TOTAL_BYTES)
  errors.push(`public/media total ${mb(total)} MB exceeds ${mb(MAX_TOTAL_BYTES)} MB`);

const groupSummary = [...groupTotals]
  .sort((a, b) => b[1] - a[1])
  .map(([group, bytes]) => `${group} ${mb(bytes)} MB`)
  .join(", ");
console.log(`check-media: ${files.length} files, ${mb(total)} MB, ${declared.size} manifest outputs`);
console.log(`check-media: groups — ${groupSummary}`);
if (errors.length) {
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}
