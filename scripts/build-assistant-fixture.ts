// Builds the static export WITH the native assistant enabled, for local/CI verification against a
// fixture-mode API only. The build runs in a temporary copy of the tracked and new files (with
// node_modules linked), so ./out and ./.next are never touched; the result lands in
// ./out-assistant-fixture/ with an UNPUBLISHABLE.txt marker. This artifact must never be deployed
// (scripts/check-assistant-disabled.ts rejects it). It also creates a one-day self-signed loopback
// certificate in the OS temp dir (`pv-assistant-tls/`) so the suite runs over HTTPS like production
// (Secure __Host- cookie, credentialed CORS); only Playwright and the test servers use it.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isolatedBuild } from "./lib/isolated-build.ts";

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

isolatedBuild(
  root,
  {
    NEXT_OUTPUT: "export",
    NEXT_PUBLIC_SITE_URL: "https://pequeverso.com",
    NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO: "https://pay.hotmart.com/TEST0000000?checkoutMode=10",
    NEXT_PUBLIC_ASSISTANT_ENABLED: "true",
    NEXT_PUBLIC_ASSISTANT_API_ORIGIN: apiOrigin,
    ASSISTANT_LOCAL_TEST_BUILD: "true",
    // The same fake pixel id as CI: the consent banner exists, so stacking with it is tested.
    // Tests abort every Meta host; nothing is sent.
    NEXT_PUBLIC_META_PIXEL_ID: "1234567890123456",
  },
  (out) => {
    rmSync(target, { recursive: true, force: true });
    cpSync(out, target, { recursive: true });
    writeFileSync(
      join(target, "UNPUBLISHABLE.txt"),
      "Verification build with the shopping assistant ENABLED against a local fixture API.\n" +
        "Not authorized for publication. Never deploy this directory.\n",
    );
  },
);
console.log(`build-assistant-fixture: wrote ${target} (API ${apiOrigin}); NOT publishable`);
