"use client";

/** Reopens the consent banner (pv:consent:open). Renders as a button styled like a link. */
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="linklike"
      onClick={() => window.dispatchEvent(new Event("pv:consent:open"))}
    >
      Configurar cookies
    </button>
  );
}
