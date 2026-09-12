import type { Metadata } from "next";
import { CTAButton } from "@/components/CTAButton/CTAButton";
import { PageShell } from "@/components/PageShell/PageShell";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell>
      <div className="container section" style={{ display: "grid", gap: "1.25rem", maxWidth: "60ch" }}>
        <p className="kicker">Error 404</p>
        <h1>Esta página no existe.</h1>
        <p className="lead">
          Puede que el enlace esté incompleto o que la página se haya movido. Estas son las salidas más
          útiles:
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <CTAButton href="/" variant="secondary">
            Ir al inicio
          </CTAButton>
          <CTAButton href="/grafismo-fonetico/" variant="secondary">
            Ver Grafismo Fonético
          </CTAButton>
          <CTAButton href="/soporte/" variant="ghost">
            Soporte
          </CTAButton>
        </div>
      </div>
    </PageShell>
  );
}
