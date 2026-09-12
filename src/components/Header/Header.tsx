import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo/BrandLogo";
import styles from "./Header.module.css";

export type NavItem = { href: string; label: string };

type Props = {
  /** Up to four in-page or site anchors. */
  nav?: NavItem[];
  /** Header CTA (a verb plus price where relevant). */
  cta?: ReactNode;
  /** Small subtitle under the brand on product pages. */
  subtitle?: string;
};

export function Header({ nav = [], cta, subtitle }: Props) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Pequeverso, ir al inicio">
          <BrandLogo priority />
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        </Link>
        {nav.length > 0 ? (
          <nav className={styles.nav} aria-label="Secciones">
            <ul role="list">
              {nav.slice(0, 4).map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {cta ? <div className={styles.cta}>{cta}</div> : null}
      </div>
    </header>
  );
}
