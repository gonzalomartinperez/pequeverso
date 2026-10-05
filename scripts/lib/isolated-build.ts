// Builds the static export in a temporary copy of the tracked and new files (node_modules linked)
// with an explicit, minimal environment, so the repository's out/ and .next/ are never touched and
// no variable leaks in from the caller's shell or .env files. Returns the temporary out/ path via
// the callback before cleanup.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export function isolatedBuild(root: string, env: Record<string, string>, use: (out: string) => void): void {
  const listed = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root })
    .toString("utf8")
    .split("\0")
    .filter((file) => file && !file.startsWith(".env"));
  const work = mkdtempSync(join(tmpdir(), "pv-isolated-build-"));
  try {
    for (const file of listed) {
      const from = join(root, file);
      if (!existsSync(from)) continue;
      mkdirSync(dirname(join(work, file)), { recursive: true });
      cpSync(from, join(work, file));
    }
    symlinkSync(join(root, "node_modules"), join(work, "node_modules"), "dir");
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString("utf8").trim();
    execFileSync("npm", ["run", "build"], {
      cwd: work,
      stdio: "inherit",
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? work,
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
        GITHUB_SHA: sha,
        ...env,
      },
    });
    use(join(work, "out"));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
