// Pins the pequeverso-assistant-api contract from a COMMITTED revision (never a working tree):
//   node scripts/pin-assistant-contract.ts <path to an API clone> <full commit sha>
// Copies contracts/** (except the Python exporter) into contracts/assistant-api/, records the
// commit and manifest hash in source.json and writes tests/assistant/api-revision for CI.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [repo, revision] = process.argv.slice(2);
if (!repo || !revision) {
  console.error("usage: node scripts/pin-assistant-contract.ts <api clone> <commit sha>");
  process.exit(2);
}
const git = (...args: string[]) => execFileSync("git", ["-C", repo, ...args]);
const sha = git("rev-parse", "--verify", `${revision}^{commit}`).toString("utf8").trim();
const target = join(root, "contracts/assistant-api");
const files = git("ls-tree", "-r", "--name-only", sha, "contracts")
  .toString("utf8")
  .split("\n")
  .filter((path) => path && !path.endsWith(".py"));

rmSync(target, { recursive: true, force: true });
for (const path of files) {
  const out = join(target, path.slice("contracts/".length));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, git("show", `${sha}:${path}`));
}
const manifest = git("show", `${sha}:contracts/manifest.json`);
const parsed = JSON.parse(manifest.toString("utf8")) as { contract_version: string; schema_version: string };
const source = {
  api_repository: "https://github.com/gonzalomartinperez/pequeverso-assistant-api",
  api_commit: sha,
  api_manifest_sha256: createHash("sha256").update(manifest).digest("hex"),
  contract_version: parsed.contract_version,
  schema_version: parsed.schema_version,
  status: "committed",
  copied_with: "node scripts/pin-assistant-contract.ts (git show <api_commit>:contracts/<path>)",
};
writeFileSync(join(target, "source.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(root, "tests/assistant/api-revision"), `${sha}\n`);
console.log(`pinned ${files.length} contract files from ${sha}`);
