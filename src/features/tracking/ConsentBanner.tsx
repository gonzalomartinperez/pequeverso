"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { onConsentChange, readConsent, writeConsent } from "@/features/tracking/consent";
import { isTrackingConfigured } from "@/features/tracking/track";
import styles from "./ConsentBanner.module.css";

/**
 * Prior-consent banner with equal "Aceptar" / "Rechazar" actions (AEPD 2024 criteria,
 * Meta Business Tools terms). Only shown when a consent-gated integration exists; the
 * footer "Cookies" control reopens it (pv:consent:open event).
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const headingId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isTrackingConfigured()) return;
    setOpen(readConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener("pv:consent:open", reopen);
    const unsubscribe = onConsentChange(() => setOpen(false));
    return () => {
      window.removeEventListener("pv:consent:open", reopen);
      unsubscribe();
    };
  }, []);

  if (!open) return null;

  return (
    <section
      className={styles.banner}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={descId}
      data-testid="consent-banner"
    >
      <div className={styles.inner}>
        <h2 id={headingId} className={styles.title}>
          Cookies y medición
        </h2>
        <p id={descId} className={styles.text}>
          Usamos cookies propias necesarias y, solo si aceptas, cookies de Meta para medir nuestras campañas.
          Puedes cambiar tu elección cuando quieras desde el pie de página.{" "}
          <Link href="/cookies/">Más información</Link>
        </p>
        {showDetails ? (
          <ul className={styles.details} role="list">
            <li>
              <strong>Necesarias:</strong> recordar tu elección de cookies. Siempre activas.
            </li>
            <li>
              <strong>Marketing (Meta):</strong> medir visitas e interés en el producto para nuestras
              campañas. Solo con tu permiso.
            </li>
          </ul>
        ) : null}
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => writeConsent(true)}>
            Aceptar
          </button>
          <button type="button" className={styles.primary} onClick={() => writeConsent(false)}>
            Rechazar
          </button>
          <button
            type="button"
            className={styles.secondary}
            aria-expanded={showDetails}
            onClick={() => setShowDetails((value) => !value)}
          >
            Configurar
          </button>
        </div>
      </div>
    </section>
  );
}
