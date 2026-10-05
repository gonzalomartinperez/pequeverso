// Regression guard: builds the export with NEXT_PUBLIC_ASSISTANT_ENABLED ABSENT from a minimal
// environment (no shell variables, no .env files) and requires an output without any assistant code.
// The build's own last step (check-assistant-disabled) must pass; this re-runs it strictly.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isolatedBuild } from "./lib/isolated-build.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
isolatedBuild(
  root,
  {
    NEXT_OUTPUT: "export",
    NEXT_PUBLIC_SITE_URL: "https://pequeverso.com",
    NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO: "https://pay.hotmart.com/TEST0000000?checkoutMode=10",
  },
  (out) => {
    execFileSync("node", [resolve(root, "scripts/check-assistant-disabled.ts"), out], { stdio: "inherit" });
  },
);
console.log(
  "check-assistant-absent-build: unset NEXT_PUBLIC_ASSISTANT_ENABLED builds without assistant code",
);
