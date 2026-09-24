import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Separator } from "@/components/ui/separator";

type Section = { id: string; title: string };
type Props = { title: string; intro?: string; updatedAt: string; sections?: Section[]; children: ReactNode };

/**
 * Layout for legal pages: heading, updated date, a sticky index (lg container and up; two
 * columns above the text on narrower containers) and ≤ 68ch prose, the measure Baymard's
 * line-length research recommends (50–75 characters).
 */
export function LegalLayout({ title, intro, updatedAt, sections = [], children }: Props) {
  return (
    <PageShell>
      <div data-slot="legal-layout" className="page-container section-pad cq grid gap-8">
        <header className="grid max-w-[68ch] gap-4">
          <h1>{title}</h1>
          {intro ? <p className="lead text-pretty">{intro}</p> : null}
          <p className="inline-flex items-center gap-2 text-small font-bold text-subtle">
            <CalendarDays aria-hidden="true" focusable="false" className="size-4 text-icon" />
            <span>Última actualización: {updatedAt}</span>
          </p>
        </header>
        <Separator />
        <div className="grid grid-cols-1 items-start gap-12 cq-lg:grid-cols-[16rem_minmax(0,1fr)] cq-lg:gap-16">
          {sections.length > 0 ? (
            <nav
              className="on-light rounded-lg border border-border bg-card p-5 text-small shadow-sm cq-lg:sticky cq-lg:top-[calc(var(--header-height)+var(--space-5))]"
              aria-label="Contenido de esta página"
            >
              <p className="mb-3 text-tiny font-extrabold tracking-[0.08em] text-teal-text uppercase">
                En esta página
              </p>
              <ol
                className="toc grid gap-x-6 gap-y-0.5 cq-sm:grid-cols-2 cq-lg:grid-cols-1"
                role="list"
              >
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
