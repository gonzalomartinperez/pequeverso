// Dependency health report: deps.dev (licence, advisories, Scorecard) plus optional npm audit.
// Usage: node tools/deps-report.ts [--root <dir>] [--audit <audit.json>] [--json]
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type FetchJson = (url: string) => Promise<unknown>;
export type Kind = "runtime" | "dev";
export type Manifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
export type Lock = { packages?: Record<string, { version?: string } | undefined> };
export type LicenceCheck = "ok" | "allowed (unmodified dynamic use, OD-80)" | "review" | "unknown";
export type Row = {
  name: string;
  kind: Kind;
  version: string;
  licences: string[];
  licenceCheck: LicenceCheck;
  scorecard: number | null;
  advisories: number | null;
  audit: string;
};
export type Args = { root: string; audit: string | null; json: boolean };

const API = "https://api.deps.dev/v3";
const MAX_CONCURRENCY = 4;
const TIMEOUT_MS = 10_000;
const ALLOWED = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "BlueOak-1.0.0",
]);
const LGPL = "LGPL-3.0-or-later";
const LGPL_NOTE = "allowed (unmodified dynamic use, OD-80)";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseArgs(argv: string[]): Args {
  const args: Args = { root: ".", audit: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--root" || arg === "--audit") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new Error(`${arg} needs a value`);
      if (arg === "--root") args.root = value;
      else args.audit = value;
      i += 1;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

export function checkLicences(licences: string[]): LicenceCheck {
  if (licences.length === 0) return "unknown";
  if (!licences.every((licence) => ALLOWED.has(licence) || licence === LGPL)) return "review";
  return licences.includes(LGPL) ? LGPL_NOTE : "ok";
}

export function parseVersion(data: unknown): {
  licences: string[];
  advisories: number | null;
  projectId: string | null;
} {
  if (!isRecord(data)) return { licences: [], advisories: null, projectId: null };
  const licences = Array.isArray(data.licenses)
    ? data.licenses.filter((l): l is string => typeof l === "string")
    : [];
  const advisories = Array.isArray(data.advisoryKeys)
    ? data.advisoryKeys.filter((k) => isRecord(k) && typeof k.id === "string").length
    : null;
  let projectId: string | null = null;
  if (Array.isArray(data.relatedProjects)) {
    for (const project of data.relatedProjects) {
      if (!isRecord(project) || project.relationType !== "SOURCE_REPO") continue;
      const key = project.projectKey;
      if (isRecord(key) && typeof key.id === "string") {
        projectId = key.id;
        break;
      }
    }
  }
  return { licences, advisories, projectId };
}

export function parseScorecard(data: unknown): number | null {
  if (!isRecord(data) || !isRecord(data.scorecard)) return null;
  const score = data.scorecard.overallScore;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

export function summariseAudit(audit: unknown, name: string): string {
  if (audit === undefined) return "n/a";
  const vulnerabilities = isRecord(audit) ? audit.vulnerabilities : undefined;
  const entry = isRecord(vulnerabilities) ? vulnerabilities[name] : undefined;
  if (!isRecord(entry) || typeof entry.severity !== "string") return "none";
  const via = Array.isArray(entry.via) ? entry.via.filter(isRecord).length : 0;
  return `${Math.max(via, 1)} ${entry.severity}`;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

type Entry = { name: string; kind: Kind };

export async function buildReport(
  manifest: Manifest,
  lock: Lock,
  fetchJson: FetchJson,
  audit?: unknown,
): Promise<Row[]> {
  const entries: Entry[] = [
    ...Object.keys(manifest.dependencies ?? {}).map((name) => ({ name, kind: "runtime" as const })),
    ...Object.keys(manifest.devDependencies ?? {}).map((name) => ({ name, kind: "dev" as const })),
  ].sort((a, b) =>
    a.kind === b.kind
      ? a.name < b.name
        ? -1
        : a.name > b.name
          ? 1
          : 0
      : a.kind === "runtime"
        ? -1
        : 1,
  );
  return mapLimit(entries, MAX_CONCURRENCY, async ({ name, kind }): Promise<Row> => {
    const installed = lock.packages?.[`node_modules/${name}`]?.version;
    const version = typeof installed === "string" ? installed : "unknown";
    const row: Row = {
      name,
      kind,
      version,
      licences: [],
      licenceCheck: "unknown",
      scorecard: null,
      advisories: null,
      audit: summariseAudit(audit, name),
    };
    if (version === "unknown") return row;
    const info = parseVersion(
      await fetchJson(
        `${API}/systems/npm/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`,
      ),
    );
    row.licences = info.licences;
    row.licenceCheck = checkLicences(info.licences);
    row.advisories = info.advisories;
    if (info.projectId !== null) {
      row.scorecard = parseScorecard(
        await fetchJson(`${API}/projects/${encodeURIComponent(info.projectId)}`),
      );
    }
    return row;
  });
}

const cell = (value: string): string => value.replaceAll("|", "\\|");

export function renderMarkdown(rows: Row[]): string {
  const header = [
    "Package",
    "Kind (runtime/dev)",
    "Version",
    "Licence",
    "Licence check",
    "Scorecard",
    "Advisories (deps.dev)",
    "npm audit",
  ];
  const lines = rows.map((row) =>
    [
      `\`${row.name}\``,
      row.kind,
      row.version,
      row.licences.length > 0 ? row.licences.join(", ") : "unknown",
      row.licenceCheck,
      row.scorecard === null ? "unknown" : String(row.scorecard),
      row.advisories === null ? "unknown" : String(row.advisories),
      row.audit,
    ]
      .map(cell)
      .join(" | "),
  );
  return [
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`,
    ...lines.map((line) => `| ${line} |`),
  ].join("\n");
}

export function renderJson(rows: Row[]): string {
  return JSON.stringify(rows, null, 2);
}

// Real network layer: 10 s timeout, one retry, 404 means "no data".
export function createFetchJson(fetchImpl: typeof fetch = fetch): FetchJson {
  return async (url) => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    const reason = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`request failed for ${url}: ${reason}`);
  };
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(
      `cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function run(
  argv: string[],
  fetchJson: FetchJson = createFetchJson(),
): Promise<string> {
  const args = parseArgs(argv);
  const root = resolve(args.root);
  const manifest = readJson(resolve(root, "package.json"));
  const lock = readJson(resolve(root, "package-lock.json"));
  if (!isRecord(manifest) || !isRecord(lock))
    throw new Error("package.json and package-lock.json must be objects");
  const audit = args.audit === null ? undefined : readJson(resolve(args.audit));
  const rows = await buildReport(manifest as Manifest, lock as Lock, fetchJson, audit);
  return args.json ? renderJson(rows) : renderMarkdown(rows);
}

if (import.meta.main) {
  run(process.argv.slice(2)).then(
    (output) => console.log(output),
    (error: unknown) => {
      console.error(`deps-report: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    },
  );
}
