"use client";

import { ArrowUpRightIcon, LifeBuoyIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { BrandLogo } from "@/components/blocks/brand-logo";
import type { NavItem } from "@/components/layout/header";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  items: readonly NavItem[];
  /** The header CTA, repeated at the foot of the sheet. */
  cta?: ReactNode | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Staggered entrance: each row waits `--i` steps after the panel starts sliding in. */
const ROW =
  "motion-safe:transition motion-safe:duration-500 motion-safe:ease-emphasis motion-safe:[transition-delay:calc(80ms+var(--i)*45ms)] group-data-[starting-style]/sheet:translate-x-6 group-data-[starting-style]/sheet:opacity-0 group-data-[ending-style]/sheet:opacity-0 group-data-[ending-style]/sheet:[transition-delay:0ms]";

/**
 * Full-height glass panel with the page anchors in large display type, the header CTA and a
 * support link. Each link closes the sheet before the page scrolls. The panel slides from the
 * right (full width on phones, 28 rem from sm) and its rows follow with a short stagger.
 */
export function MobileNavSheet({ items, cta, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel="Cerrar el menú"
        aria-label="Menú de secciones"
        className="group/sheet on-light gap-0 overflow-y-auto overscroll-contain border-white/80 data-[side=right]:bg-cream data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:sm:rounded-l-2xl data-[side=right]:sm:shadow-float motion-safe:duration-500 motion-safe:ease-emphasis data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full [&>[data-slot=sheet-close]]:top-3 [&>[data-slot=sheet-close]]:right-3 [&>[data-slot=sheet-close]]:size-11 [&>[data-slot=sheet-close]]:rounded-full [&>[data-slot=sheet-close]]:border-navy/14 [&>[data-slot=sheet-close]]:bg-white/80"
      >
        {/* Soft aurora glows behind the content (decorative). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1 overflow-hidden">
          <div className="absolute -top-24 -right-20 size-96 rounded-full bg-[radial-gradient(closest-side,oklch(0.8521_0.0956_187.2/35%),transparent)]" />
          <div className="absolute bottom-10 -left-24 size-96 rounded-full bg-[radial-gradient(closest-side,var(--pv-peach),transparent)]" />
          <div className="absolute top-1/3 right-1/4 size-64 rounded-full bg-[radial-gradient(closest-side,var(--pv-celeste),transparent)]" />
        </div>

        <SheetHeader className="gap-5 px-6 pt-3.5 pb-2">
          <BrandLogo />
          <div className="grid gap-1">
            <SheetTitle className="text-tiny font-extrabold tracking-[0.12em] text-teal-text uppercase">
              Secciones
            </SheetTitle>
            <SheetDescription className="text-small text-subtle">
              Ir directamente a una parte de esta página.
            </SheetDescription>
          </div>
        </SheetHeader>

        <nav aria-label="Secciones" className="px-4">
          <ol className="grid" role="list">
            {items.map((item, index) => (
              <li
                key={item.href}
                className={`${ROW} border-b border-navy/8 last:border-b-0`}
                style={{ "--i": index } as CSSProperties}
              >
                <SheetClose
                  render={<a href={item.href} />}
                  className="group/link flex min-h-16 items-center gap-4 rounded-lg px-2 font-display text-[1.75rem] leading-tight font-bold tracking-[-0.01em] text-heading no-underline transition-colors duration-(--duration-fast) hover:bg-white/70"
                >
                  <span
                    aria-hidden="true"
                    className="w-6 font-sans text-tiny font-extrabold text-teal-text tabular-nums"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-navy/12 bg-white/70 text-navy transition duration-(--duration) ease-out group-hover/link:bg-navy group-hover/link:text-white motion-safe:group-hover/link:rotate-45"
                  >
                    <ArrowUpRightIcon className="size-5" focusable="false" />
                  </span>
                </SheetClose>
              </li>
            ))}
          </ol>
        </nav>

        <div
          className={`${ROW} mt-auto grid gap-4 px-6 pt-8 pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] [&>div>a]:w-full [&>div>a]:min-h-14 [&>div>a]:rounded-pill [&>div>a]:text-[1.0625rem]`}
          style={{ "--i": items.length } as CSSProperties}
        >
          {cta ? <div>{cta}</div> : null}
          <a
            href="/soporte/"
            className="inline-flex min-h-11 items-center justify-center gap-2 text-small font-bold text-link no-underline hover:underline"
          >
            <LifeBuoyIcon aria-hidden="true" focusable="false" className="size-4" />
            ¿Necesitas ayuda? Soporte y contacto
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
