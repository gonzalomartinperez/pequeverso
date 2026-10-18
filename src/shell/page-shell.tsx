import type { ReactNode } from "react";
import { PageMotion } from "@/shell/page-motion.tsx";
import { Footer } from "@/shell/site-footer.tsx";
import { Header, type NavItem } from "@/shell/site-header.tsx";
import { WithdrawalStrip } from "@/shell/withdrawal-strip.tsx";

type Props = {
  children: ReactNode;
  nav?: readonly NavItem[];
  cta?: ReactNode;
  subtitle?: string;
  topbar?: ReactNode;
  /**
   * The header floats over the first band (a hero that paints behind it). The page's first band
   * must then reserve `var(--header-height)` of top padding itself.
   */
  overlay?: boolean;
  /** Header «Productos» menu (see Header). */
  products?: boolean;
  /** Hub page (home, support, legal, 404): the footer also lists the recommended course. */
  hub?: boolean;
};

/** Withdrawal link + header + main landmark + footer. Every route uses it so navigation is complete everywhere. */
export function PageShell({
  children,
  nav,
  cta,
  subtitle,
  topbar,
  overlay = false,
  products = false,
  hub = false,
}: Props) {
  return (
    <div data-slot="page-shell" className="flex min-h-dvh flex-col">
      <WithdrawalStrip />
      {topbar}
      <Header nav={nav} cta={cta} subtitle={subtitle} overlay={overlay} products={products} />
      <main id="contenido" className="flex-[1_0_auto]">
        <PageMotion>{children}</PageMotion>
      </main>
      <Footer hub={hub} />
    </div>
  );
}
