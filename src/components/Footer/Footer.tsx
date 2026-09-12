import { site } from "@config/site";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo/BrandLogo";
import { CookieSettingsLink } from "./CookieSettingsLink";
import styles from "./Footer.module.css";

const productLinks = [
  { href: "/", label: "Inicio" },
  { href: "/grafismo-fonetico/", label: "Grafismo Fonético" },
  { href: "/grafismo-fonetico/#incluye", label: "Qué incluye" },
  { href: "/grafismo-fonetico/#preguntas", label: "Preguntas frecuentes" },
];

const helpLinks = [
  { href: "/soporte/", label: "Soporte y contacto" },
  { href: "/compras-y-reembolsos/", label: "Compras y reembolsos" },
  { href: "/grafismo-fonetico/gracias/", label: "Acceso a tu compra" },
];

const legalLinks = [
  { href: "/aviso-legal/", label: "Aviso legal" },
  { href: "/privacidad/", label: "Privacidad" },
  { href: "/cookies/", label: "Cookies" },
  { href: "/terminos/", label: "Términos de compra" },
];

const socialLinks = [
  { href: site.social.instagram, label: "Instagram" },
  { href: site.social.tiktok, label: "TikTok" },
  { href: site.social.facebook, label: "Facebook" },
  { href: site.social.youtube, label: "YouTube" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <BrandLogo className={styles.logo} />
          <p className={styles.tagline}>{site.tagline}</p>
          <ul className={styles.social} role="list" aria-label="Redes sociales">
            {socialLinks.map((item) => (
              <li key={item.href}>
                <a href={item.href} rel="noopener" target="_blank">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <nav aria-label="Producto">
          <p className={styles.heading}>Producto</p>
          <ul role="list">
            {productLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Ayuda">
          <p className={styles.heading}>Ayuda</p>
          <ul role="list">
            {helpLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className={styles.heading}>Legal</p>
          <ul role="list">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
        </nav>
      </div>
      <div className={`container ${styles.bottom}`}>
        <p>
          Material educativo complementario. No sustituye la escuela ni una terapia y no garantiza resultados
          específicos.
        </p>
        <p>
          © {new Date().getFullYear()} {site.name} · Operado por {site.operator}. Pagos, entrega y reembolsos
          gestionados por Hotmart.
        </p>
      </div>
    </footer>
  );
}
