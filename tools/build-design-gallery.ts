// Builds the static export WITH the state gallery (`/_design`) for local/CI verification. Like
// tools/build-assistant-fixture.ts it builds in a temporary copy (./out and ./.next stay
// untouched) and writes ./out-design-gallery/ with an UNPUBLISHABLE.txt marker. Serve it with
// `SERVE_DIR=out-design-gallery node tools/serve-static.ts`. Never deploy this directory
// (tools/check-design-gallery-disabled.ts rejects it).
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isolatedBuild } from "./lib/isolated-build.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "out-design-gallery");

isolatedBuild(
  root,
  {
    NEXT_OUTPUT: "export",
    NEXT_PUBLIC_SITE_URL: "https://pequeverso.com",
    NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO:
      "https://pay.hotmart.com/TEST0000000?checkoutMode=10",
    NEXT_PUBLIC_DESIGN_GALLERY: "true",
    NEXT_PUBLIC_META_PIXEL_ID: "1234567890123456",
  },
  (out) => {
    rmSync(target, { recursive: true, force: true });
    cpSync(out, target, { recursive: true });
    writeFileSync(
      join(target, "UNPUBLISHABLE.txt"),
      "Verification build with the design state gallery (/_design) ENABLED.\nNever deploy this directory.\n",
    );
  },
);
console.log(`build-design-gallery: wrote ${target}; NOT publishable`);
