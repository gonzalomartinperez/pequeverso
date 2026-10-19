// Writes public/build-info.json so a deployed revision can be verified over HTTP
// (deploy.yml compares .sha with the commit it built). Served with Cache-Control: no-store.
// `assistant` records whether the native assistant was compiled in; only "disabled" builds are
// publishable (tools/check-assistant-disabled.ts).
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOutput } from "./lib/build-target.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Same precedence as Next.js (and tools/check-env.ts): existing process.env wins.
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
  // Same detection as config/next.ts: Hostinger's builder is standalone without NEXT_OUTPUT.
  output: buildOutput(),
  site_analytics: process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true" ? "enabled" : "disabled",
  assistant: (process.env.NEXT_PUBLIC_ASSISTANT_ENABLED ?? "").trim() === "true" ? "enabled" : "disabled",
};

mkdirSync(resolve(root, "public"), { recursive: true });
writeFileSync(resolve(root, "public/build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(
  `build-info: ${info.sha.slice(0, 12)} (${info.ref}, ${info.output}, assistant ${info.assistant})`,
);
