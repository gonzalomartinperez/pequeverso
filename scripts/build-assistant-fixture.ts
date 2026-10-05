// Builds the static export WITH the native assistant enabled, for local/CI verification against a
// fixture-mode API only. The build runs in a temporary copy of the tracked and new files (with
// node_modules linked), so ./out and ./.next are never touched; the result lands in
// ./out-assistant-fixture/ with an UNPUBLISHABLE.txt marker. This artifact must never be deployed
// (scripts/check-assistant-disabled.ts rejects it). It also creates a one-day self-signed loopback
// certificate in the OS temp dir (`pv-assistant-tls/`) so the suite runs over HTTPS like production
// (Secure __Host- cookie, credentialed CORS); only Playwright and the test servers use it.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "out-assistant-fixture");
const apiOrigin = process.env.ASSISTANT_TEST_API_ORIGIN || "https://127.0.0.1:8217";
const tls = join(tmpdir(), "pv-assistant-tls");

mkdirSync(tls, { recursive: true });
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-days",
    "1",
    "-subj",
    "/CN=127.0.0.1",
    "-addext",
    "subjectAltName=IP:127.0.0.1",
    "-keyout",
    join(tls, "key.pem"),
    "-out",
    join(tls, "cert.pem"),
  ],
  { stdio: "ignore" },
);

const listed = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const work = mkdtempSync(join(tmpdir(), "pv-assistant-build-"));
try {
  for (const file of listed) {
    const from = join(root, file);
    if (!existsSync(from)) continue; // deleted in the working tree
    mkdirSync(dirname(join(work, file)), { recursive: true });
    cpSync(from, join(work, file));
  }
  symlinkSync(join(root, "node_modules"), join(work, "node_modules"), "dir");
  execFileSync("npm", ["run", "build"], {
    cwd: work,
    stdio: "inherit",
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? work,
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_OUTPUT: "export",
      NEXT_PUBLIC_SITE_URL: "https://pequeverso.com",
      NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO: "https://pay.hotmart.com/TEST0000000?checkoutMode=10",
      NEXT_PUBLIC_ASSISTANT_ENABLED: "true",
      NEXT_PUBLIC_ASSISTANT_API_ORIGIN: apiOrigin,
      ASSISTANT_LOCAL_TEST_BUILD: "true",
      GITHUB_SHA:
        process.env.GITHUB_SHA ||
        execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString("utf8").trim(),
    },
  });
  rmSync(target, { recursive: true, force: true });
  cpSync(join(work, "out"), target, { recursive: true });
  writeFileSync(
    join(target, "UNPUBLISHABLE.txt"),
    "Verification build with the shopping assistant ENABLED against a local fixture API.\n" +
      "Not authorized for publication. Never deploy this directory.\n",
  );
  console.log(`build-assistant-fixture: wrote ${target} (API ${apiOrigin}); NOT publishable`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
