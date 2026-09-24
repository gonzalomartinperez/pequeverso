import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header, type NavItem } from "@/components/layout/header";
import { WithdrawalStrip } from "@/components/layout/withdrawal-strip";
import { PageMotion } from "@/motion/page-motion";

type Props = {
  children: ReactNode;
  nav?: readonly NavItem[];
  cta?: ReactNode;
  subtitle?: string;
  topbar?: ReactNode;
};

/** Withdrawal link + header + main landmark + footer. Every route uses it so navigation is complete everywhere. */
export function PageShell({ children, nav, cta, subtitle, topbar }: Props) {
  return (
    <div data-slot="page-shell" className="flex min-h-dvh flex-col">
      <WithdrawalStrip />
      {topbar}
      <Header nav={nav} cta={cta} subtitle={subtitle} />
      <main id="contenido" className="flex-[1_0_auto]">
        <PageMotion>{children}</PageMotion>
      </main>
      <Footer />
    </div>
  );
}
