import { guaranteeDays, hotmart } from "@config/commerce";
import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { CTAButton } from "@/components/CTAButton/CTAButton";
import { Icon, type IconName } from "@/components/Icon/Icon";
import { PageShell } from "@/components/PageShell/PageShell";
import { buildMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  path: "/soporte/",
  title: "Soporte y contacto",
  description:
    "Ayuda para acceder a tu compra, pedir un reembolso o resolver cualquier duda sobre los materiales de Pequeverso.",
});

const routes: { icon: IconName; title: string; text: string; cta: { label: string; href: string } }[] = [
  {
    icon: "login",
    title: "No encuentro mi compra",
    text: "Revisa Spam y Promociones y entra en consumer.hotmart.com con el correo que usaste al pagar. Ahí están tus archivos.",
    cta: { label: "Ir a Hotmart", href: hotmart.consumerArea },
  },
  {
    icon: "refresh",
    title: "Quiero un reembolso",
    text: `Tienes ${guaranteeDays} días desde la compra. Pídelo en refund.hotmart.com con tu número de transacción (empieza con HP).`,
    cta: { label: "Pedir reembolso", href: hotmart.refunds },
  },
  {
    icon: "mail",
    title: "Otra duda",
    text: `Escríbenos y te respondemos con calma, normalmente en ${seller.responseTime}. Incluye el correo de la compra si ya compraste.`,
    cta: { label: "Escribir por correo", href: `mailto:${seller.supportEmail}` },
  },
];

export default function SoportePage() {
  return (
    <PageShell>
      <section className="section" aria-labelledby="soporte-title">
        <div className="container">
          <header className={styles.header} data-reveal>
            <p className="kicker">Soporte y contacto</p>
            <h1 id="soporte-title">Estamos para ayudarte.</h1>
            <p className="lead">
              Elige la situación que se parece más a la tuya. Si no encaja en ninguna, escríbenos
              directamente.
            </p>
          </header>
          <ul className={styles.grid} role="list">
            {routes.map((route) => (
              <li key={route.title} className={styles.card} data-reveal>
                <span className={styles.icon}>
                  <Icon name={route.icon} size={26} strokeWidth={2.2} />
                </span>
                <h2 className={styles.title}>{route.title}</h2>
                <p>{route.text}</p>
                <CTAButton href={route.cta.href} variant="secondary" size="small" external>
                  {route.cta.label}
                </CTAButton>
              </li>
            ))}
          </ul>
          <div className={styles.notes}>
            <p>
              <strong>Lo que no podemos hacer:</strong> ver ni modificar datos de pago, ni cambiar el correo
              de una compra. Esas gestiones las hace Hotmart desde su centro de ayuda.
            </p>
            <p>
              Correo de soporte: <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> · Más
              detalle en <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
