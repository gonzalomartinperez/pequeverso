"use client";

const INLINE_LINK =
  "inline min-h-6 cursor-pointer text-link underline decoration-1 underline-offset-[0.15em] hover:text-link-hover";

/** Reopens the consent banner (pv:consent:open): a button styled as an inline link unless the caller passes classes. */
export function CookieSettingsLink({ className = INLINE_LINK }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event("pv:consent:open"))}
    >
      Configurar cookies
    </button>
  );
}
