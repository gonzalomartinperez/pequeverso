// @ts-check
// Guards the public repository against heavy or undocumented media:
// - every file under public/media must have a record in media/manifest.json
// - no single media file above MAX_FILE_BYTES, total media under MAX_TOTAL_BYTES
// - no source/original formats (psd, ai, mov, 4k masters) slip in
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const mediaDir = resolve(root, "public/media");
const manifestPath = resolve(root, "media/manifest.json");
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const FORBIDDEN_EXT = new Set([".psd", ".ai", ".mov", ".tif", ".tiff", ".pdf", ".zip", ".sql"]);

const toPosix = (p) => p.split("\\").join("/");

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
for (const item of manifest.items || []) {
  for (const output of item.outputs || []) declared.add(toPosix(output.file));
}

const errors = [];
let total = 0;
for (const file of files) {
  const rel = toPosix(relative(root, file));
  const size = statSync(file).size;
  total += size;
  const ext = rel.slice(rel.lastIndexOf(".")).toLowerCase();
  if (FORBIDDEN_EXT.has(ext)) errors.push(`forbidden format: ${rel}`);
  if (size > MAX_FILE_BYTES) errors.push(`too large (${(size / 1048576).toFixed(2)} MB): ${rel}`);
  if (!declared.has(rel)) errors.push(`missing manifest record: ${rel}`);
}
for (const rel of declared) {
  if (!existsSync(resolve(root, rel))) errors.push(`manifest references missing file: ${rel}`);
}
if (total > MAX_TOTAL_BYTES)
  errors.push(`public/media total ${(total / 1048576).toFixed(2)} MB exceeds 25 MB`);

console.log(
  `check-media: ${files.length} files, ${(total / 1048576).toFixed(2)} MB, ${declared.size} manifest outputs`,
);
if (errors.length) {
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}
