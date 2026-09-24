// Asserts the deferred 3D scene (three + gsap, src/motion/scene/scene-runtime.ts) never enters
// the initial client bundle and that its chunk closure stays within the gzip budget in
// config/budgets.json. Reads .next/scene-budget.json written by scripts/scene-budget-plugin.ts.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const report = resolve(root, ".next/scene-budget.json");
const budgets = JSON.parse(readFileSync(resolve(root, "config/budgets.json"), "utf8")) as {
  scene?: { js?: unknown };
};
const limit = budgets.scene?.js;

if (!existsSync(report)) {
  console.error("check-scene: .next/scene-budget.json not found; run `npm run build` first");
  process.exit(1);
}
if (typeof limit !== "number") {
  console.error("check-scene: config/budgets.json needs a `scene.js` budget (gzip bytes)");
  process.exit(1);
}

const scene = JSON.parse(readFileSync(report, "utf8")) as {
  entry: string;
  roots: number;
  initial: boolean;
  files: string[];
};
const failures: string[] = [];
if (scene.roots === 0) failures.push(`scene entry ${scene.entry} is missing from the client compilation`);
if (scene.initial) failures.push("scene chunks can be initial: the loader must `await import()` the runtime");
if (scene.files.length === 0) failures.push("scene closure lists no JavaScript files");

const size = scene.files.reduce(
  (total, file) => total + gzipSync(readFileSync(join(root, ".next", file))).length,
  0,
);
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;
if (size > limit) failures.push(`scene closure ${kb(size)} > ${kb(limit)}`);

console.log(
  `check-scene: ${scene.files.length} deferred chunk(s), ${kb(size)} gzip (budget ${kb(limit)}), initial=${scene.initial}`,
);
if (failures.length) {
  for (const failure of failures) console.error(`✖ ${failure}`);
  process.exit(1);
}
