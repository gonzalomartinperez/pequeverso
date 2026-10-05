// Writes public/build-info.json so a deployed revision can be verified over HTTP
// (deploy.yml compares .sha with the commit it built). Served with Cache-Control: no-store.
// `assistant` records whether the native assistant was compiled in; only "disabled" builds are
// publishable (scripts/check-assistant-disabled.ts).
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Same precedence as Next.js (and scripts/check-env.ts): existing process.env wins.
for (const name of [".env.production.local", ".env.local", ".env.production", ".env"]) {
  const file = resolve(root, name);
  if (existsSync(file)) process.loadEnvFile(file);
}

function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

const info = {
  sha: process.env.GITHUB_SHA || git("rev-parse HEAD") || "unknown",
  ref: process.env.GITHUB_REF_NAME || git("rev-parse --abbrev-ref HEAD") || "unknown",
  builtAt: new Date().toISOString(),
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : "export",
  assistant: (process.env.NEXT_PUBLIC_ASSISTANT_ENABLED ?? "").trim() === "true" ? "enabled" : "disabled",
};

mkdirSync(resolve(root, "public"), { recursive: true });
writeFileSync(resolve(root, "public/build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(
  `build-info: ${info.sha.slice(0, 12)} (${info.ref}, ${info.output}, assistant ${info.assistant})`,
);
