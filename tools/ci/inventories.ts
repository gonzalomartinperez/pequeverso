/** Validate real Playwright test identities; configs and discovered cases remain distinct. */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const coreMatrix = {
  include: ["functional", "native"].flatMap((suite, offset) =>
    [1, 2, 3, 4].map((shard) => ({ index: offset * 4 + shard, suite, shard, shards: 4 })),
  ),
};
export const nightlyMatrix = {
  include: Array.from({ length: 8 }, (_, index) => ({ shard: index + 1, shards: 8 })),
};

const widths = [1440, 1280, 1024, 768, 430, 390, 360];
export const projects = {
  functional: [
    "firefox-390",
    "webkit-390",
    "chromium-1440",
    "chromium-768",
    "chromium-390",
    "reduced-motion",
  ],
  native: [
    "chromium-desktop",
    "chromium-mobile",
    "chromium-reduced-motion",
    "firefox-desktop",
    "webkit-desktop",
    "webkit-mobile",
  ],
  nightly: ["chromium", "webkit"].flatMap((browser) => widths.map((width) => `${browser}-${width}`)),
} as const;
export type Suite = keyof typeof projects;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid test inventory");
  return value as Record<string, unknown>;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Invalid test inventory");
  return value;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("Invalid test identity");
  return value;
}

export function testIdentities(value: unknown, suite: Suite, complete = false): string[] {
  const report = object(value);
  if (report.errors !== undefined && list(report.errors).length) throw new Error("Inventory contains errors");
  const identities: string[] = [];
  const observed = new Set<string>();
  function visit(value: unknown, parents: string[]): void {
    const branch = object(value);
    const title = typeof branch.title === "string" ? branch.title : "";
    const titles = [...parents, title];
    for (const value of list(branch.specs ?? [])) {
      const spec = object(value);
      const file = text(spec.file);
      if (
        !Number.isInteger(spec.line) ||
        Number(spec.line) < 1 ||
        !Number.isInteger(spec.column) ||
        Number(spec.column) < 1
      )
        throw new Error("Invalid spec position");
      for (const value of list(spec.tests)) {
        const test = object(value);
        const project = text(test.projectName);
        if (!(projects[suite] as readonly string[]).includes(project))
          throw new Error("Unexpected project/configuration");
        observed.add(project);
        if (spec.id !== undefined && typeof spec.id !== "string") throw new Error("Invalid spec identity");
        if (
          test.repeatEachIndex !== undefined &&
          (!Number.isInteger(test.repeatEachIndex) || Number(test.repeatEachIndex) < 0)
        )
          throw new Error("Invalid repeat identity");
        identities.push(
          JSON.stringify([
            suite,
            project,
            file,
            spec.line,
            spec.column,
            ...titles,
            text(spec.title),
            spec.id ?? null,
            test.repeatEachIndex ?? 0,
          ]),
        );
      }
    }
    for (const child of list(branch.suites ?? [])) visit(child, titles);
  }
  for (const branch of list(report.suites)) visit(branch, []);
  if (!identities.length || new Set(identities).size !== identities.length) {
    throw new Error("Empty or duplicated test inventory");
  }
  if (complete && projects[suite].some((project) => !observed.has(project)))
    throw new Error("Incomplete project catalogue");
  return identities.sort();
}

export function requirePartition(full: string[], parts: string[][]): void {
  if (!full.length || !parts.length || new Set(full).size !== full.length)
    throw new Error("Invalid full inventory");
  if (parts.some((part) => !part.length || new Set(part).size !== part.length))
    throw new Error("Invalid partition");
  const union = parts.flat().sort();
  if (new Set(union).size !== union.length || JSON.stringify(union) !== JSON.stringify([...full].sort())) {
    throw new Error("Partitions must be disjoint and cover every test exactly");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [mode, suite, fullPath, outputPath, ...partPaths] = process.argv.slice(2);
    if (mode === "matrix") {
      if (suite !== "core" && suite !== "nightly") throw new Error("Unknown matrix");
      console.log(JSON.stringify(suite === "core" ? coreMatrix : nightlyMatrix));
    } else {
      if (mode !== "verify" || !suite || !Object.hasOwn(projects, suite) || !fullPath || !outputPath) {
        throw new Error("Explicit inventory/configuration paths are required");
      }
      const kind = suite as Suite;
      const full = testIdentities(JSON.parse(readFileSync(fullPath, "utf8")), kind, true);
      const parts = partPaths.map((path) => testIdentities(JSON.parse(readFileSync(path, "utf8")), kind));
      const expectedParts = kind === "functional" || kind === "native" ? 4 : 8;
      if (parts.length !== expectedParts) throw new Error("Unexpected partition count");
      requirePartition(full, parts);
      const receipt = {
        configuration: kind,
        full: full.length,
        parts: parts.map((part) => part.length),
        exactUnion: true,
        disjoint: true,
        executed: false,
      };
      writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
      console.log(JSON.stringify(receipt));
    }
  } catch {
    console.error("Test inventory verification failed; no coverage acceptance was produced.");
    process.exitCode = 1;
  }
}
