// Publishable artifacts must keep collection OFF until separate owner activation.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const allowEnabled = process.argv.includes("--allow-enabled");
const info = JSON.parse(readFileSync("public/build-info.json", "utf8")) as {
  site_analytics?: unknown;
  output?: unknown;
};
if (info.site_analytics === "enabled" && allowEnabled) {
  console.warn("site analytics ENABLED: isolated verification artifact only");
} else {
  if (info.site_analytics !== "disabled")
    throw new Error("Publishable build requires site analytics disabled");
  const roots = info.output === "standalone" ? [".next/static", ".next/server/app"] : ["out"];
  let scanned = 0;
  function scan(root: string) {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      const path = join(root, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (/\.(?:js|mjs|html|txt)$/.test(path)) {
        scanned++;
        if (readFileSync(path, "utf8").includes("/api/v1/analytics/events"))
          throw new Error("Disabled artifact contains site analytics transport");
      }
    }
  }
  for (const root of roots) {
    if (!existsSync(root)) throw new Error("Build output missing");
    scan(root);
  }
  if (!scanned) throw new Error("Build output empty");
  console.log(`check-site-analytics-disabled: ${scanned} emitted text files, no collection transport`);
}
