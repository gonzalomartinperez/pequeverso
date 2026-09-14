"use client";

import { errorCopy as copy } from "@content/es/soporte";
import Link from "next/link";
import { useEffect } from "react";

type Props = { error: Error & { digest?: string }; reset: () => void };

/** Route error boundary; a client component on every route, so it uses the global button classes only. */
export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="contenido" className="container section">
      <div style={{ display: "grid", gap: "1rem", maxWidth: "60ch", justifyItems: "start" }}>
        <p className="kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => reset()} className="button button--primary">
            {copy.retry}
          </button>
          <Link href="/" className="button button--secondary">
            {copy.home}
          </Link>
          <Link href="/soporte/" className="button button--secondary">
            {copy.support}
          </Link>
        </div>
      </div>
    </main>
  );
}
