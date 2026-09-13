import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header, type NavItem } from "@/components/layout/Header/Header";
import styles from "./PageShell.module.css";

type Props = {
  children: ReactNode;
  nav?: readonly NavItem[];
  cta?: ReactNode;
  subtitle?: string;
  topbar?: ReactNode;
};

/** Header + main landmark + footer. Every route uses it so navigation is complete everywhere. */
export function PageShell({ children, nav, cta, subtitle, topbar }: Props) {
  return (
    <div className={styles.shell}>
      {topbar}
      <Header nav={nav} cta={cta} subtitle={subtitle} />
      <main id="contenido" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
