import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { CTAButton } from "@/components/ui/CTAButton/CTAButton";
import { coreProducts } from "@/products";

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
          <CTAButton href="/" variant="secondary" iconAfter="arrow">
            Ir al inicio
          </CTAButton>
          {coreProducts().map((product) => (
            <CTAButton key={product.slug} href={product.path} variant="secondary" iconAfter="arrow">
              Ver {product.name}
            </CTAButton>
          ))}
          <CTAButton href="/soporte/" variant="ghost" iconAfter="arrow">
            Soporte
          </CTAButton>
        </div>
      </div>
    </PageShell>
  );
}
