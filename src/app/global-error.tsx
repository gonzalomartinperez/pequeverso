"use client";

import "./globals.css";

/**
 * Root error boundary: replaces the whole document, so it carries the stylesheet itself and
 * uses plain token utilities (no variant functions) to stay out of every page's bundle weight.
 * Same aurora ground and glass card as the route error boundary.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body className="aurora-cream grid min-h-dvh place-items-center px-(--gutter) py-16">
        <main className="glass grid w-full max-w-[40rem] justify-items-start gap-5 rounded-2xl p-[clamp(1.5rem,5vw,3rem)] shadow-float ring-1 ring-navy/8">
          <p className="font-display text-2xl leading-none font-bold text-navy">pequeverso</p>
          <h1 className="text-balance">Pequeverso no está disponible en este momento.</h1>
          <p className="lead">Vuelve a intentarlo en unos minutos.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-14 cursor-pointer rounded-pill border-2 border-secondary bg-secondary px-8 font-extrabold text-secondary-foreground hover:bg-secondary-hover"
          >
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
