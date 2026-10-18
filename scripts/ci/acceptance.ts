/** Fail-closed result evaluation shared by the real CI and Nightly aggregate steps. */
import { pathToFileURL } from "node:url";

export const prerequisites = {
  core: ["workflows", "secrets", "quality", "build", "hosting", "browser", "performance"],
  nightly: ["prepare", "quality", "browser", "visual", "links", "bundle"],
  bridge: ["workflows", "secrets", "quality", "build", "hosting", "browser", "performance", "checks"],
} as const;

export function requireSuccessfulJobs(value: unknown, profile: keyof typeof prerequisites): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Required job evidence is missing");
  }
  const results = value as Record<string, unknown>;
  const expected = prerequisites[profile];
  if (
    Object.keys(results).length !== expected.length ||
    expected.some((name) => !Object.hasOwn(results, name))
  ) {
    throw new Error("Required job inventory differs from the selected profile");
  }
  for (const name of expected) {
    const item = results[name];
    if (!item || typeof item !== "object" || (item as Record<string, unknown>).result !== "success") {
      throw new Error("Every required job must complete successfully");
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const profile = process.argv[2];
    if (profile !== "core" && profile !== "nightly" && profile !== "bridge") {
      throw new Error("Unknown required-check profile");
    }
    requireSuccessfulJobs(JSON.parse(process.env.CI_NEEDS ?? "null"), profile);
    console.log("All required jobs completed successfully; this does not authorize delivery.");
  } catch {
    console.error("Required checks failed: incomplete or unsuccessful job evidence.");
    process.exitCode = 1;
  }
}
