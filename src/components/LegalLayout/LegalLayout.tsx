import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell/PageShell";
import styles from "./LegalLayout.module.css";

type Section = { id: string; title: string };
type Props = { title: string; intro?: string; updatedAt: string; sections?: Section[]; children: ReactNode };

/** Layout for legal and support pages: heading, updated date, optional TOC, 65ch prose. */
export function LegalLayout({ title, intro, updatedAt, sections = [], children }: Props) {
  return (
    <PageShell>
      <div className={`container section ${styles.wrap}`}>
        <header className={styles.header}>
          <h1>{title}</h1>
          {intro ? <p className="lead">{intro}</p> : null}
          <p className={styles.updated}>Última actualización: {updatedAt}</p>
        </header>
        <div className={styles.columns}>
          {sections.length > 0 ? (
            <nav className={styles.toc} aria-label="Contenido de esta página">
              <p className={styles.tocTitle}>En esta página</p>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <article className={`prose ${styles.prose}`}>{children}</article>
        </div>
      </div>
    </PageShell>
  );
}
