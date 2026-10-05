import { assistantConfig } from "@config/assistant";
import { site } from "@config/site";
import { getImage } from "@/lib/media";
import { coreProducts } from "@/products";
import { parseAssistantEnv } from "./flag";
import type { RouteContext } from "./mount";

/**
 * Server slot in the root layout. The conditional `import()` is resolved at build time: with
 * `NEXT_PUBLIC_ASSISTANT_ENABLED` anything but "true" the bundler drops the branch, so no
 * assistant module, chunk or string is emitted (verified by scripts/check-assistant-disabled.ts).
 * Keep the comparison inline: an imported constant would not be folded. config/next.ts always
 * defines the variable (normalized "true"/"false"), so an unset variable is folded too.
 */
export async function AssistantSlot() {
  const mount = process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === "true" ? await import("./mount") : null;
  if (!mount) return null;
  // Enabled builds re-validate the origin here too (dev servers skip scripts/check-env.ts).
  const parsed = parseAssistantEnv({
    enabled: "true",
    apiOrigin: process.env.NEXT_PUBLIC_ASSISTANT_API_ORIGIN,
    localTestBuild: process.env.ASSISTANT_LOCAL_TEST_BUILD,
  });
  if (!parsed.ok || !parsed.flag.enabled)
    throw new Error(parsed.ok ? "assistant flag" : parsed.errors.join("; "));
  const routes: RouteContext[] = [
    ...assistantConfig.staticRoutes,
    ...coreProducts().map((product) => ({ path: `/${product.slug}/`, page: "product" as const })),
  ];
  const avatar = getImage("brand.isotipo");
  const small = avatar.renditions.find((r) => r.width >= 96) ?? avatar.renditions[0];
  return (
    <mount.AssistantMount
      apiOrigin={parsed.flag.apiOrigin}
      storefrontOrigin={new URL(site.url).origin}
      linkHosts={assistantConfig.linkHosts}
      routes={routes}
      avatarSrc={small?.src ?? avatar.src}
      supportPath={assistantConfig.supportPath}
      privacyPath={assistantConfig.privacyPath}
    />
  );
}
