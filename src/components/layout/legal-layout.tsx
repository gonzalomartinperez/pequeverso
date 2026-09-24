import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";

type Section = { id: string; title: string };
type Props = { title: string; intro?: string; updatedAt: string; sections?: Section[]; children: ReactNode };

/** Layout for legal and support pages: heading, updated date, optional sticky TOC, 65ch prose. */
export function LegalLayout({ title, intro, updatedAt, sections = [], children }: Props) {
  return (
    <PageShell>
      <div data-slot="legal-layout" className="page-container section-pad cq grid gap-8">
        <header className="grid max-w-[70ch] gap-3">
          <h1>{title}</h1>
          {intro ? <p className="lead">{intro}</p> : null}
          <p className="text-small text-subtle">Última actualización: {updatedAt}</p>
        </header>
        <div className="grid grid-cols-1 items-start gap-12 cq-lg:grid-cols-[16rem_minmax(0,1fr)]">
          {sections.length > 0 ? (
            <nav
              className="text-small cq-lg:sticky cq-lg:top-[calc(var(--header-height)+var(--space-4))]"
              aria-label="Contenido de esta página"
            >
              <p className="mb-2 font-extrabold text-heading">En esta página</p>
              <ol className="grid list-decimal gap-1 pl-[1.2em]">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <article className="prose cq min-w-0">{children}</article>
        </div>
      </div>
    </PageShell>
  );
}
