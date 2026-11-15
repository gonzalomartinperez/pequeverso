// Ratchet baselines (ecosystem 16, docs/master-plan/scorecard.md): one JSON file per metric under
// ratchets/. A value with direction "min" is a floor that may only rise; "max" is a ceiling that may
// only fall. This skeleton loads and validates the files, compares a measurement with a baseline and
// checks that an edited baseline only tightens; the scorecard tool (M2-9) builds on it.
// Usage: node tools/scorecard/ratchets.ts [ratchets-dir]  (prints a summary, exit 1 if invalid)
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type Direction = "min" | "max";
export type RatchetValue = {
  key: string;
  value: number;
  unit: string;
  direction: Direction;
};
export type Ratchet = {
  metric: string;
  measuredAt: string;
  commit: string;
  source: string;
  values: RatchetValue[];
  /** Absent means enforce. `warn` is a time-boxed soft gate and needs `expires`. */
  mode?: "warn" | "enforce";
  /** Last day (inclusive, YYYY-MM-DD) a `warn` ratchet only warns; it enforces from the next day. */
  expires?: string;
  /**
   * True once the values were calibrated from real CI runs rather than provisional placeholders.
   * A ratchet that declares a `mode` must have it once it enforces (`needsCalibration`).
   */
  calibrated?: boolean;
  /**
   * Record of an owner-approved re-baseline (a ratchet's values may rise or fall away from their
   * direction once, under a NEW ADR). `loosened` honours it only when the caller's `approves`
   * callback accepts the record and it differs from the previous file's record.
   */
  rebaseline?: Rebaseline;
};
export type Rebaseline = {
  /** The ADR that approves the re-baseline, `ADR-NNNN`; it must be new in the same change. */
  adr: string;
  /** Who approved and when, `owner YYYY-MM-DD`; the ADR header must read `Owner approval: <approved>`. */
  approved: string;
  /** The develop commit the new values were measured at. */
  from: string;
};

const DAY_MS = 86_400_000;
/** A warn window may be at most this many days after `measuredAt` (ci-cd.md: warn for 14 days). */
export const MAX_WARN_DAYS = 14;
const isDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
const dayNumber = (value: string): number => Date.parse(`${value}T00:00:00Z`) / DAY_MS;

/**
 * Whether a ratchet warns or enforces on `today` (YYYY-MM-DD, UTC: the flip happens at 00:00 UTC
 * the day after `expires`). Expiry is inclusive: a `warn` ratchet warns through its `expires` date
 * and enforces from the next day. Fails closed for every consumer: a missing or malformed
 * `expires` or `measuredAt`, an `expires` more than MAX_WARN_DAYS after `measuredAt`, or an
 * unknown mode, enforces.
 */
export function ratchetPhase(
  ratchet: Pick<Ratchet, "mode" | "expires" | "measuredAt">,
  today: string,
): "warn" | "enforce" {
  if (ratchet.mode !== "warn") return "enforce";
  if (!isDate(ratchet.expires) || !isDate(ratchet.measuredAt) || !isDate(today)) return "enforce";
  if (dayNumber(ratchet.expires) - dayNumber(ratchet.measuredAt) > MAX_WARN_DAYS) return "enforce";
  return today <= ratchet.expires ? "warn" : "enforce";
}

/**
 * A ratchet that declares a `mode` started as a time-boxed soft gate with provisional values; once
 * it enforces, those values must have been calibrated (`calibrated: true`), whatever its `source`
 * text says.
 */
export function needsCalibration(
  ratchet: Pick<Ratchet, "mode" | "expires" | "measuredAt" | "calibrated">,
  today: string,
): boolean {
  return (
    ratchet.mode !== undefined &&
    ratchetPhase(ratchet, today) === "enforce" &&
    ratchet.calibrated !== true
  );
}

function rebaselineProblems(data: Record<string, unknown>, file: string): string[] {
  const record = data.rebaseline;
  if (record === undefined) return [];
  if (!isRecord(record)) return [`${file}: rebaseline must be an object`];
  const problems: string[] = [];
  if (typeof record.adr !== "string" || !/^ADR-\d{4}$/.test(record.adr))
    problems.push(`${file}: rebaseline.adr must look like ADR-0019`);
  if (typeof record.approved !== "string" || !/^owner \d{4}-\d{2}-\d{2}$/.test(record.approved))
    problems.push(`${file}: rebaseline.approved must look like "owner YYYY-MM-DD"`);
  if (typeof record.from !== "string" || !/^[0-9a-f]{7,40}$/.test(record.from))
    problems.push(`${file}: rebaseline.from must be a git SHA`);
  return problems;
}

function phaseProblems(data: Record<string, unknown>, file: string): string[] {
  if (data.calibrated !== undefined && typeof data.calibrated !== "boolean")
    return [`${file}: calibrated must be a boolean`];
  if (data.mode === undefined && data.expires === undefined) return [];
  if (data.mode !== "warn" && data.mode !== "enforce")
    return [`${file}: mode must be "warn" or "enforce"`];
  if (data.mode === "enforce") return [];
  if (!isDate(data.expires)) return [`${file}: a warn ratchet needs expires (YYYY-MM-DD)`];
  if (!isDate(data.measuredAt)) return [];
  const days = dayNumber(data.expires) - dayNumber(data.measuredAt);
  return days > MAX_WARN_DAYS
    ? [`${file}: expires must be at most ${MAX_WARN_DAYS} days after measuredAt`]
    : [];
}

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
  problems.push(...phaseProblems(data, file), ...rebaselineProblems(data, file));
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
 *
 * Narrow exception: when `after.rebaseline` is a new record (its `adr` differs from
 * `before.rebaseline`'s) and `approves(record)` returns true, moving a value away from its
 * direction is accepted. Removed keys, direction or unit changes and the phase checks (mode,
 * expires, calibrated) still count. Without `approves`, a record never excuses anything.
 */
export function loosened(
  before: Ratchet,
  after: Ratchet,
  approves?: (record: Rebaseline) => boolean,
): string[] {
  const record = after.rebaseline;
  const rebased =
    record !== undefined && record.adr !== before.rebaseline?.adr && approves?.(record) === true;
  const next = new Map(after.values.map((item) => [item.key, item]));
  const phase: string[] = [];
  // enforce -> warn, or a later warn expiry, postpones enforcement: a loosening.
  const wasWarn = before.mode === "warn";
  if (before.calibrated === true && after.calibrated !== true) phase.push("calibrated");
  if (!wasWarn && after.mode === "warn") phase.push("mode");
  if (wasWarn && after.mode === "warn" && (after.expires ?? "") > (before.expires ?? ""))
    phase.push("expires");
  return [
    ...phase,
    ...before.values
      .filter((old) => {
        const current = next.get(old.key);
        return (
          !current ||
          current.direction !== old.direction ||
          current.unit !== old.unit ||
          (!rebased && !holds(old, current.value))
        );
      })
      .map((old) => old.key),
  ];
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
