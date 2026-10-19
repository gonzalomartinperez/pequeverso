import { parseAnalyticsEnv } from "../../../config/site-analytics-env.ts";

export async function SiteAnalyticsSlot() {
  const mount =
    process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true" ? await import("./mount.tsx") : null;
  if (!mount) return null;
  const flag = parseAnalyticsEnv({
    enabled: "true",
    apiOrigin: process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_API_ORIGIN,
    localTestBuild: process.env.PRODUCT_ANALYTICS_LOCAL_TEST_BUILD,
  });
  if (!flag.enabled) return null;
  return <mount.SiteAnalyticsMount endpoint={flag.endpoint} />;
}
