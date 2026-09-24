import { site } from "@config/site";
import { seller, sellerIdentity } from "@content/es/legal/seller";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/blocks/brand-logo";
import { SocialLinks } from "@/components/blocks/social-links";
import { CookieSettingsLink } from "@/features/tracking/CookieSettingsLink";
import { coreProducts } from "@/products";

const productLinks = [
  { href: "/", label: "Inicio" },
  ...coreProducts().flatMap((product) => [
    { href: product.path, label: product.name },
    { href: `${product.path}#incluye`, label: "Qué incluye" },
    { href: `${product.path}#preguntas`, label: "Preguntas frecuentes" },
  ]),
];

const helpLinks = [
  { href: "/soporte/", label: "Soporte y contacto" },
  { href: "/compras-y-reembolsos/", label: "Reembolsos" },
  ...coreProducts().map((product) => ({ href: product.funnel.thanksPath, label: "Acceso a tu compra" })),
];

const legalLinks = [
  // Disposición SSDCyLC 954/2025 art. 1: exact label, no registration; first-screen placement is owner/landing work.
  { href: "/arrepentimiento/", label: "Botón de arrepentimiento" },
  { href: "/aviso-legal/", label: "Aviso legal" },
  { href: "/privacidad/", label: "Privacidad" },
  { href: "/cookies/", label: "Cookies" },
  { href: "/terminos/", label: "Términos de compra" },
];

/** Footer link (or button styled as one): white, gold on hover, 24 px minimum target. */
const footerLinkClass =
  "inline-block min-h-6 py-0.5 text-left font-semibold text-white no-underline hover:text-gold hover:underline";

const headingClass = "mb-3 text-small font-extrabold tracking-[0.06em] text-gold uppercase";

type Column = { label: string; items: { href: string; label: string }[]; children?: ReactNode };

function LinkColumn({ label, items, children }: Column) {
  return (
    <nav aria-label={label}>
      <p className={headingClass}>{label}</p>
      <ul className="grid gap-2" role="list">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={footerLinkClass}>
              {item.label}
            </Link>
          </li>
        ))}
        {children}
      </ul>
    </nav>
  );
}

/** Navy-deep site footer: brand, social profiles, product/help/legal columns and the disclaimer. */
export function Footer() {
  return (
    <footer data-slot="footer" className="on-navy mt-auto bg-navy-deep pt-16 pb-8 text-white">
      <div className="page-container cq">
        <div className="grid gap-8 cq-sm:grid-cols-2 cq-lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="grid content-start gap-4 cq-sm:col-span-full cq-lg:col-span-1">
            <BrandLogo className="text-white" />
            <p className="max-w-[28ch] text-white/82">{site.tagline}</p>
            <p className="text-small font-extrabold text-gold">Síguenos: @somospequeverso</p>
            <SocialLinks tone="dark" />
          </div>
          <LinkColumn label="Producto" items={productLinks} />
          <LinkColumn label="Ayuda" items={helpLinks}>
            <li>
              <a href={`mailto:${site.supportEmail}`} className={footerLinkClass}>
                {site.supportEmail}
              </a>
            </li>
          </LinkColumn>
          <LinkColumn label="Legal" items={legalLinks}>
            <li>
              <CookieSettingsLink className={footerLinkClass} />
            </li>
          </LinkColumn>
        </div>
      </div>
      <div className="page-container mt-12 grid gap-2 border-t border-white/16 pt-6 [&_p]:text-small [&_p]:text-white/72">
        <p>
          Material educativo complementario. No sustituye la escuela ni una terapia y no garantiza resultados
          específicos.
        </p>
        <p>
          © {new Date().getFullYear()} {site.name}. Pagos, entrega y reembolsos gestionados por Hotmart.
        </p>
        {/* Seller identification in plain view before the purchase (Res. SCI 270/2020, GMC 37/19). */}
        <p>
          Titular: {sellerIdentity}, {seller.address}.
        </p>
      </div>
    </footer>
  );
}
