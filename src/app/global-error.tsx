"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          background: "#fffaf2",
          color: "#0b1f3a",
        }}
      >
        <h1>Pequeverso no está disponible en este momento.</h1>
        <p>Vuelve a intentarlo en unos minutos.</p>
        <button type="button" onClick={() => reset()} style={{ minHeight: 44, padding: "0 1.5rem" }}>
          Intentar de nuevo
        </button>
      </body>
    </html>
  );
}
