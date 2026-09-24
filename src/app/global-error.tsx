"use client";

import "./globals.css";

/**
 * Root error boundary: replaces the whole document, so it carries the stylesheet itself and
 * uses plain token utilities (no variant functions) to stay out of every page's bundle weight.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body className="page-container section-pad">
        <div className="grid max-w-[60ch] justify-items-start gap-4">
          <h1>Pequeverso no está disponible en este momento.</h1>
          <p className="lead">Vuelve a intentarlo en unos minutos.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-14 rounded-pill bg-primary px-8 font-extrabold text-primary-foreground hover:bg-primary-hover"
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
