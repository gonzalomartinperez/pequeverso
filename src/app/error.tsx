"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="contenido" className="container section">
      <p className="kicker">Algo salió mal</p>
      <h1 style={{ marginTop: "1rem" }}>No pudimos mostrar esta página.</h1>
      <p className="lead" style={{ marginTop: "1rem", maxWidth: "60ch" }}>
        Puedes intentar de nuevo o volver al inicio. Si compraste el kit y necesitas ayuda, escríbenos desde
        la página de soporte.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
        <button type="button" onClick={() => reset()} className="button button--primary">
          Intentar de nuevo
        </button>
        <Link href="/" className="button button--secondary">
          Ir al inicio
        </Link>
        <Link href="/soporte/" className="button button--secondary">
          Soporte
        </Link>
      </div>
    </main>
  );
}
