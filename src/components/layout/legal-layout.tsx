import { CalendarDays, ChevronDownIcon, LifeBuoyIcon, ListIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CTAButton } from "@/components/blocks/cta-button";
import { PageShell } from "@/components/layout/page-shell";

export type Section = { id: string; title: string };
type Props = {
  title: string;
  intro?: string;
  updatedAt: string;
  sections?: readonly Section[];
  children: ReactNode;
};

const TOC_LABEL = "Contenido de esta página";
const TOC_HEADING = "text-tiny font-extrabold tracking-[0.12em] text-teal-text uppercase";
/** Index rows: pill hover on the `toc` counter list (numbers come from the utility). */
const TOC_LIST =
  "toc grid gap-y-0.5 [&_a]:rounded-md [&_a]:px-2 [&_a:hover]:bg-white [&_a:hover]:text-navy";

function TocList({ sections, className }: { sections: readonly Section[]; className?: string }) {
  return (
    <ol className={`${TOC_LIST} ${className ?? ""}`} role="list">
      {sections.map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`}>{section.title}</a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Layout for legal pages: an aurora heading band under the floating header (title, intro, a
 * glass "updated" pill), then the text in a white paper card at ≤ 68ch — the measure Baymard's
 * line-length research recommends (50–75 characters) — beside a sticky glass index (lg container
 * and up). On narrower containers the index is a collapsible glass card above the text.
 */
export function LegalLayout({ title, intro, updatedAt, sections = [], children }: Props) {
  const hasToc = sections.length > 0;
  return (
    <PageShell
      overlay
      cta={
        <CTAButton href="/soporte/" variant="ghost" size="sm" icon={LifeBuoyIcon}>
          Soporte
        </CTAButton>
      }
    >
      <div data-slot="legal-layout" className="cq">
        <header className="aurora-sky relative overflow-clip pt-[calc(var(--header-height)+clamp(2.5rem,7vw,5rem))] pb-[clamp(3rem,7vw,5.5rem)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute top-[18%] -right-24 size-[26rem] rounded-full border border-navy/8 max-sm:hidden" />
            <div className="absolute top-[calc(18%+3.5rem)] right-[calc(-6rem+3.5rem)] size-[19rem] rounded-full border border-dashed border-teal/20 max-sm:hidden" />
            <div className="planet-gold absolute top-[calc(18%+12.5rem)] right-[19.5rem] size-4 rounded-full max-sm:hidden" />
          </div>
          <div className="page-container relative grid gap-5">
            <h1 className="max-w-[18ch] text-balance">{title}</h1>
            {intro ? <p className="lead max-w-[60ch] text-pretty">{intro}</p> : null}
            <p className="glass inline-flex items-center gap-2 justify-self-start rounded-pill px-4 py-2 text-tiny font-bold text-body shadow-sm sm:text-small">
              <CalendarDays aria-hidden="true" focusable="false" className="size-4 text-icon" />
              <span>Última actualización: {updatedAt}</span>
            </p>
          </div>
        </header>

        <div className="bg-[linear-gradient(180deg,var(--pv-celeste),var(--pv-cream)_36rem)] pb-(--section-pad)">
          <div
            className={
              hasToc
                ? "page-container grid grid-cols-1 items-start gap-6 cq-lg:grid-cols-[16.5rem_minmax(0,1fr)] cq-lg:gap-10"
                : "page-container grid grid-cols-1"
            }
          >
            {hasToc ? (
              <>
                <details className="pv-details group glass rounded-xl shadow-sm ring-1 ring-navy/6 cq-lg:hidden">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 font-extrabold text-heading [&::-webkit-details-marker]:hidden">
                    <ListIcon aria-hidden="true" focusable="false" className="size-5 text-icon" />
                    <span className="flex-1">En esta página</span>
                    <span className="text-tiny font-bold text-subtle">{sections.length} apartados</span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      focusable="false"
                      className="size-5 text-icon transition-transform duration-(--duration) group-open:rotate-180"
                    />
                  </summary>
                  <nav aria-label={TOC_LABEL} className="border-t border-navy/8 px-3 pt-2 pb-4 text-small">
                    <TocList sections={sections} className="cq-sm:grid-cols-2 cq-sm:gap-x-4" />
                  </nav>
                </details>
                <nav
                  className="glass hidden rounded-xl p-4 text-small shadow-float ring-1 ring-navy/6 cq-lg:sticky cq-lg:top-[calc(var(--header-height)+var(--space-5))] cq-lg:block"
                  aria-label={TOC_LABEL}
                >
                  <p className={`${TOC_HEADING} mb-3 px-2`}>En esta página</p>
                  <TocList sections={sections} />
                </nav>
              </>
            ) : null}
            <article className="on-light min-w-0 rounded-2xl bg-card p-[clamp(1.25rem,4.5vw,3.5rem)] shadow-float ring-1 ring-navy/6 cq-xl:max-w-[calc(68ch+7rem)]">
              <div className="prose cq min-w-0">{children}</div>
            </article>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/**
 * Numbered section heading of a legal page: "3. Datos que se tratan". The number and title come
 * from the same `sections` list that feeds the index, so both always agree.
 */
export function SectionHeading({ sections, id }: { sections: readonly Section[]; id: string }) {
  const index = sections.findIndex((section) => section.id === id);
  const section = sections[index];
  if (!section) throw new Error(`SectionHeading: unknown section "${id}"`);
  return (
    <h2 id={id}>
      {index + 1}. {section.title}
    </h2>
  );
}
