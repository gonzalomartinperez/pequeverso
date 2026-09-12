import type { ReactNode } from "react";

/**
 * Wraps a page that has an upsell and a downsell view. A classic inline script runs before
 * the sibling views are parsed and sets data-offer from the URL (`?downsell=1` or
 * `?offer=downsell`), so global CSS can hide the inactive view before first paint — no
 * flash, no layout shift, no redirect. `suppressHydrationWarning` covers the attribute
 * React did not render. Works identically on the static and Node targets.
 */
const script = `(function(){try{var q=new URLSearchParams(location.search);var d=q.get("downsell")==="1"||q.get("offer")==="downsell";var s=document.currentScript;var r=s&&s.parentElement;if(r){r.setAttribute("data-offer",d?"downsell":"upsell");}}catch(e){}})();`;

export function OfferModeRoot({ children }: { children: ReactNode }) {
  return (
    <main id="contenido" data-offer-root data-offer="upsell" suppressHydrationWarning>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, constant pre-hydration script (see docs/architecture.md) */}
      <script dangerouslySetInnerHTML={{ __html: script }} />
      {children}
    </main>
  );
}
