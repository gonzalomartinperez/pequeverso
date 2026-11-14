// Builds the production-config export for the Lighthouse lane (M2-1): the fake CI pixel id is
// compiled in so Meta's script loads as in production. Like tools/build-design-gallery.ts it builds
// in a temporary copy (./out and ./.next stay untouched) and writes ./out-lhci/ (gitignored) with
// an UNPUBLISHABLE.txt marker. Serve it with `SERVE_DIR=out-lhci node tools/serve-static.ts`.
// Never deploy this directory.
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isolatedBuild } from "./lib/isolated-build.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "out-lhci");

isolatedBuild(
  root,
  {
    NEXT_OUTPUT: "export",
    NEXT_PUBLIC_SITE_URL: "https://pequeverso.com",
    NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO:
      "https://pay.hotmart.com/TEST0000000?checkoutMode=10",
    NEXT_PUBLIC_META_PIXEL_ID: "1234567890123456",
  },
  (out) => {
    rmSync(target, { recursive: true, force: true });
    cpSync(out, target, { recursive: true });
    writeFileSync(
      join(target, "UNPUBLISHABLE.txt"),
      "Verification build with a FAKE Meta Pixel id for the Lighthouse lane.\nNever deploy this directory.\n",
    );
  },
);
console.log(`build-lhci: wrote ${target}; NOT publishable`);
