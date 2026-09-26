import { site } from "@config/site";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
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
  "inline-block min-h-6 py-0.5 text-left font-semibold text-white/92 no-underline decoration-gold decoration-2 underline-offset-4 transition-colors duration-(--duration-fast) hover:text-gold hover:underline";

const headingClass =
  "mb-4 inline-flex items-center gap-2 text-tiny font-extrabold tracking-[0.12em] text-gold uppercase before:size-1.5 before:rounded-full before:bg-gold before:content-['']";

/**
 * Seeded starfield painted as radial gradients (no image request, no JS): mostly white pin
 * points, a few gold ones. Deterministic, so every build renders the same sky.
 */
function starfield(count: number, seed: number): string {
  let state = seed;
  const next = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  const stars: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const x = Math.round(next() * 100);
    const y = Math.round(next() * 100);
    const size = next() > 0.82 ? 2 : next() > 0.5 ? 1.5 : 1;
    const colour = next() > 0.9 ? "#ffd840" : next() > 0.5 ? "#fffc" : "#fff8";
    stars.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%,${colour} 50%,#0000 51%)`);
  }
  return stars.join(",");
}

const emailParts = site.supportEmail.split("@");

const STARS: CSSProperties = { backgroundImage: starfield(30, 20260926) };

type Column = { label: string; items: { href: string; label: string }[]; children?: ReactNode };

function LinkColumn({ label, items, children }: Column) {
  return (
    <nav aria-label={label}>
      <p className={headingClass}>{label}</p>
      <ul className="grid gap-2.5" role="list">
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

/**
 * The closing universe of every page: a navy nebula with a soft arc top that overlaps the last
 * band, a still starfield, brand + social profiles, the product/help/legal columns, the
 * disclaimer, and a giant outlined "pequeverso" wordmark
 * (decorative) sinking into the bottom edge.
 */
export function Footer() {
  return (
    <footer
      data-slot="footer"
      className="on-navy sky-nebula arc-top relative isolate z-1 mt-[calc(-1*clamp(2rem,5vw,4rem))] overflow-clip pt-[clamp(4.5rem,9vw,7rem)] text-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1">
        <div className="absolute inset-0 opacity-80" style={STARS} />
        <div className="absolute -top-40 left-[12%] size-[28rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.8521_0.0956_187.2/12%),transparent)]" />
        <div className="planet-gold absolute top-14 right-[7%] size-3 rounded-full opacity-90 shadow-glow" />
        <div className="absolute top-8 right-[calc(7%-2.25rem)] size-21 rounded-full border border-white/12" />
      </div>

      <div className="page-container cq">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 cq-lg:grid-cols-[1.5fr_repeat(3,1fr)] cq-lg:gap-8">
          <div className="col-span-full grid content-start gap-5 cq-lg:col-span-1">
            <BrandLogo className="text-white [&>span]:text-[1.75rem]" />
            <p className="max-w-[30ch] text-lead leading-snug font-semibold text-balance text-white/86">
              {site.tagline}
            </p>
            <div className="grid gap-3">
              <p className="text-small font-extrabold text-gold">Síguenos: @somospequeverso</p>
              <SocialLinks tone="dark" />
            </div>
          </div>
          <LinkColumn label="Producto" items={productLinks} />
          <LinkColumn label="Ayuda" items={helpLinks}>
            <li>
              <a href={`mailto:${site.supportEmail}`} className={footerLinkClass}>
                {emailParts[0]}
                <wbr />@{emailParts[1]}
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

      <div className="page-container mt-14 grid gap-2 border-t border-white/14 pt-6 [&_p]:text-small [&_p]:text-white/72">
        <p>
          Material educativo complementario. No sustituye la escuela ni una terapia y no garantiza resultados
          específicos.
        </p>
        <p>
          © {new Date().getFullYear()} {site.name}. Pagos, entrega y reembolsos gestionados por Hotmart.
        </p>
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none mt-8 -mb-[0.2em] text-center font-display text-[clamp(4.5rem,18.5vw,17rem)] leading-[0.9] font-bold tracking-[-0.045em] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_oklch(1_0_0/22%)] [background-image:linear-gradient(180deg,oklch(1_0_0/14%),oklch(1_0_0/0%)_70%)] bg-clip-text"
      >
        pequeverso
      </p>
    </footer>
  );
}
