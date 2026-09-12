import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell/PageShell";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/",
  title: "Pequeverso | Recursos imprimibles para aprender en familia",
  description:
    "Recursos imprimibles para acompañar los primeros pasos hacia la lectura de niños de 3 a 7 años. Letras, sonidos, sílabas, palabras y trazos listos para imprimir.",
});

export default function HomePage() {
  return (
    <PageShell>
      <section className="container section">
        <h1>Recursos imprimibles para acompañar sus primeros pasos hacia la lectura.</h1>
      </section>
    </PageShell>
  );
}
