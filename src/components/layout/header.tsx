import { MenuIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/blocks/brand-logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

type Props = {
  /** Up to four in-page or site anchors. */
  nav?: readonly NavItem[] | undefined;
  /** Header CTA (a verb plus price where relevant). */
  cta?: ReactNode | undefined;
  /** Small subtitle under the brand on product pages. */
  subtitle?: string | undefined;
  /** Float over the first band instead of taking its own row (see PageShell `overlay`). */
  overlay?: boolean | undefined;
};

/**
 * Menu trigger: a 44 px round glass button. Computed here (server) so the client island ships
 * no class table.
 */
const MENU_TRIGGER =
  "inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-navy/14 bg-white/80 text-navy transition duration-(--duration-fast) ease-out hover:border-navy/30 hover:bg-white motion-safe:active:scale-95 lg:hidden [&_svg]:size-5";

/**
 * Sticky site header: a floating glass pill (brand, inline anchors from lg, the single CTA and
 * a menu sheet below lg) with a gold → turquoise scroll-progress line underneath. The row
 * around the pill is transparent and lets clicks through, so over an `overlay` hero the band
 * paints behind it and on a plain page the row shows the page background. The pill condenses
 * (tighter, stronger shadow) once the page scrolls: scroll-driven CSS, no JavaScript.
 * The CTA is the last tab stop of the header.
 */
export function Header({ nav = [], cta, subtitle, overlay = false }: Props) {
  const items = nav.slice(0, 4);
  return (
    <header
      data-slot="header"
      data-overlay={overlay ? "" : undefined}
      className={cn(
        "pointer-events-none sticky top-0 z-50 h-(--header-height) [container-type:scroll-state]",
        overlay && "-mb-(--header-height)",
      )}
    >
      <div
        data-slot="header-pill"
        className={cn(
          "on-light pv-header-pill glass pointer-events-auto relative mx-auto mt-2.5 flex h-15 w-[min(calc(var(--page-max)+1.5rem),100%-1rem)] items-center gap-2 rounded-full py-2 pr-2 pl-2 shadow-md ring-1 ring-navy/8 transition-all duration-(--duration) ease-out sm:w-[min(calc(var(--page-max)+1.5rem),100%-1.5rem)] sm:gap-3 sm:pl-3",
          // Condensed once the header is stuck (Chromium scroll-state queries; elsewhere it stays roomy).
          "[@container_scroll-state(stuck:top)]:mt-2 [@container_scroll-state(stuck:top)]:h-14 [@container_scroll-state(stuck:top)]:bg-white/86",
        )}
      >
        <Link
          href="/"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-3 rounded-full pr-1 text-navy no-underline"
          aria-label="Pequeverso, ir al inicio"
        >
          <BrandLogo priority wordmark="sm-up" />
          {subtitle ? (
            <span
              className={cn(
                "hidden max-w-52 border-l border-navy/14 pl-3 text-tiny leading-tight font-bold text-subtle",
                items.length > 0 ? "xl:inline" : "md:inline",
              )}
            >
              {subtitle}
            </span>
          ) : null}
        </Link>
        {items.length > 0 ? (
          <nav className="ml-auto hidden lg:block" aria-label="Secciones">
            <ul className="flex items-center gap-1" role="list">
              {items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-[0.95rem] font-bold text-body no-underline transition-colors duration-(--duration-fast) hover:bg-navy/6 hover:text-navy"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <div
          className={cn(
            "ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2 [&>a]:rounded-pill [&>a]:max-sm:min-h-11 [&>a]:max-sm:px-4 [&>a]:max-sm:text-[0.95rem] [&>a_svg]:max-sm:hidden",
            items.length > 0 && "lg:ml-2",
          )}
        >
          {cta}
          {items.length > 0 ? (
            <MobileNav items={items} cta={cta} className={MENU_TRIGGER}>
              <MenuIcon aria-hidden="true" focusable="false" strokeWidth={2.4} />
              <span className="sr-only">Abrir el menú</span>
            </MobileNav>
          ) : null}
        </div>
        <span
          aria-hidden="true"
          className="pv-scroll-progress pointer-events-none absolute inset-x-7 -bottom-1.5 h-0.75 rounded-full bg-linear-to-r from-gold to-turquoise"
        />
      </div>
    </header>
  );
}
