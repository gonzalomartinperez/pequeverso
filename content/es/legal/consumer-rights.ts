/**
 * "Si compras desde…" reference for /arrepentimiento/. One row per market, sorted alphabetically
 * (Spanish collation). `period` is stated only when an official or primary legal source was read
 * (docs/legal-checklist.md lists them, read 2026-09-24); otherwise it is `null` and the page shows
 * only the authority link. `tests/unit/consumer-rights.test.ts` checks https links, sources and order.
 */
export type ConsumerRightsEntry = {
  country: string;
  /** Consumer-protection authority. */
  authority: string;
  /** Official page where a consumer files a complaint (or the authority's home page). */
  url: string;
  /** Statutory withdrawal period for distance/online sales, or null when not verified. */
  period: string | null;
  /** Short note: statute and, where it exists, the digital-content exception. */
  note: string;
  /** Primary source for `period` (required when `period` is not null). */
  source?: string;
};

export const consumerRights: readonly ConsumerRightsEntry[] = [
  {
    country: "Argentina",
    authority: "Defensa de las y los Consumidores",
    url: "https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor",
    period: "10 días corridos",
    note: "Ley 24.240, art. 34, y CCyC, art. 1110. El art. 1116 exceptúa, salvo pacto en contrario, los archivos descargables de inmediato.",
    source: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/638/texact.htm",
  },
];
