import { MenuIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/blocks/brand-logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { buttonVariants } from "@/components/ui/button-variants";
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
 * Sticky site header: brand (wordmark from sm), inline anchors from lg, the single CTA, and a
 * sheet with the same anchors below lg. The CTA is the last tab stop of the header.
 */
export function Header({ nav = [], cta, subtitle, overlay = false }: Props) {
  const items = nav.slice(0, 4);
  return (
    <header
      data-slot="header"
      data-overlay={overlay ? "" : undefined}
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-surface-veil",
        overlay && "-mb-(--header-height)",
      )}
    >
      <div className="page-container flex min-h-(--header-height) items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-navy no-underline"
          aria-label="Pequeverso, ir al inicio"
        >
          <BrandLogo priority wordmark="sm-up" />
          {subtitle ? (
            <span
              className={cn(
                "hidden max-w-56 border-l border-border pl-3 text-tiny leading-tight font-bold text-subtle",
                items.length > 0 ? "xl:inline" : "sm:inline",
              )}
            >
              {subtitle}
            </span>
          ) : null}
        </Link>
        {items.length > 0 ? (
          <nav className="ml-auto hidden lg:block" aria-label="Secciones">
            <ul className="flex gap-6" role="list">
              {items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-block py-2 font-bold text-body no-underline transition-colors duration-(--duration-fast) hover:text-navy"
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
            "ml-auto flex min-w-0 items-center gap-2 [&>a]:max-sm:min-h-11 [&>a]:max-sm:px-4 [&>a]:max-sm:text-[0.95rem] [&>a_svg]:max-sm:hidden",
            items.length > 0 && "lg:ml-0",
          )}
        >
          {cta}
          {items.length > 0 ? (
            <MobileNav
              items={items}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
            >
              <MenuIcon aria-hidden="true" focusable="false" strokeWidth={2.4} />
              <span className="sr-only">Abrir el menú</span>
            </MobileNav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
