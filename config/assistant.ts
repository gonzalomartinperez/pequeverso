/**
 * Facts of the native shopping assistant that are not deployment values. The switch and the API
 * origin are build-time variables (src/features/assistant/flag.ts); the assistant ships disabled.
 */
export const assistantConfig = {
  /**
   * Extra https hosts the assistant may link to (Hotmart buyer area and refund form), mirroring
   * the API's catalog allowlist (`CATALOG_ALLOWED_HOSTS`). Product, purchase and image URLs must
   * be on the storefront origin itself.
   */
  linkHosts: ["consumer.hotmart.com", "refund.hotmart.com"],
  supportPath: "/soporte/",
  privacyPath: "/privacidad/",
  /**
   * Where the launcher appears: the hub, core product landings and support. Never on the
   * post-purchase offer, thank-you or legal pages (owner decision recorded in the API handoff).
   */
  staticRoutes: [
    { path: "/", page: "home" },
    { path: "/soporte/", page: "support" },
  ],
} as const;
