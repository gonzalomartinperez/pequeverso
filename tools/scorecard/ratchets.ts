// Ratchet baselines (ecosystem 16, docs/master-plan/scorecard.md): one JSON file per metric under
// ratchets/. A value with direction "min" is a floor that may only rise; "max" is a ceiling that may
// only fall. This skeleton loads and validates the files, compares a measurement with a baseline and
// checks that an edited baseline only tightens; the scorecard tool (M2-9) builds on it.
// Usage: node tools/scorecard/ratchets.ts [ratchets-dir]  (prints a summary, exit 1 if invalid)
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type Direction = "min" | "max";
export type RatchetValue = { key: string; value: number; unit: string; direction: Direction };
export type Ratchet = {
  metric: string;
  measuredAt: string;
  commit: string;
  source: string;
  values: RatchetValue[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function headerProblems(data: Record<string, unknown>, file: string): string[] {
  const problems: string[] = [];
  const expectedMetric = path.basename(file, ".json");
  if (data.metric !== expectedMetric) problems.push(`${file}: metric must be "${expectedMetric}"`);
  if (typeof data.measuredAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.measuredAt))
    problems.push(`${file}: measuredAt must be YYYY-MM-DD`);
  if (typeof data.commit !== "string" || !/^[0-9a-f]{7,40}$/.test(data.commit))
    problems.push(`${file}: commit must be a git SHA`);
  if (typeof data.source !== "string" || !data.source) problems.push(`${file}: source is required`);
  return problems;
}

function valueProblems(item: unknown, file: string): string[] {
  if (!isRecord(item) || typeof item.key !== "string" || !item.key)
    return [`${file}: every value needs a key`];
  const problems: string[] = [];
  if (typeof item.value !== "number" || !Number.isFinite(item.value))
    problems.push(`${file}: "${item.key}" value must be a finite number`);
  if (item.direction !== "min" && item.direction !== "max")
    problems.push(`${file}: "${item.key}" direction must be min or max`);
  if (typeof item.unit !== "string") problems.push(`${file}: "${item.key}" unit must be a string`);
  return problems;
}

/** Validates one parsed ratchet file; returns the problems (empty when valid). */
export function validateRatchet(data: unknown, file: string): string[] {
  if (!isRecord(data)) return [`${file}: not an object`];
  const problems = headerProblems(data, file);
  if (!Array.isArray(data.values) || data.values.length === 0)
    return [...problems, `${file}: values must be a non-empty array`];
  const keys = data.values.map((item) => (isRecord(item) ? item.key : undefined));
  const duplicates = keys.filter(
    (key, index) => typeof key === "string" && keys.indexOf(key) !== index,
  );
  for (const key of new Set(duplicates)) problems.push(`${file}: duplicate key "${String(key)}"`);
  return [...problems, ...data.values.flatMap((item) => valueProblems(item, file))];
}

/** Loads and validates every ratchets/*.json file. Throws on any invalid file. */
export function loadRatchets(dir: string): Ratchet[] {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
  const problems: string[] = [];
  const ratchets: Ratchet[] = [];
  for (const name of files) {
    const file = path.join(dir, name);
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      problems.push(`${name}: invalid JSON`);
      continue;
    }
    const found = validateRatchet(data, name);
    if (found.length) problems.push(...found);
    else ratchets.push(data as Ratchet);
  }
  if (problems.length) throw new Error(problems.join("\n"));
  return ratchets;
}

/** True when a measurement respects the baseline (a floor not undercut, a ceiling not exceeded). */
export function holds(baseline: RatchetValue, measured: number): boolean {
  return baseline.direction === "min" ? measured >= baseline.value : measured <= baseline.value;
}

/**
 * Keys whose baseline was loosened between two versions of a ratchet file (a floor lowered, a
 * ceiling raised, a direction or unit changed, or a key removed). Ratchets may only tighten.
 */
export function loosened(before: Ratchet, after: Ratchet): string[] {
  const next = new Map(after.values.map((item) => [item.key, item]));
  return before.values
    .filter((old) => {
      const current = next.get(old.key);
      return (
        !current ||
        current.direction !== old.direction ||
        current.unit !== old.unit ||
        !holds(old, current.value)
      );
    })
    .map((old) => old.key);
}

if (import.meta.main) {
  const dir = process.argv[2] ?? path.resolve(import.meta.dirname, "../../ratchets");
  try {
    const ratchets = loadRatchets(dir);
    for (const ratchet of ratchets)
      console.log(
        `${ratchet.metric}: ${ratchet.values.length} values (${ratchet.measuredAt}, ${ratchet.commit})`,
      );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
