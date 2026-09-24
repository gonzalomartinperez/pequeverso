"use client";

import { ArrowRightIcon } from "lucide-react";
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

type Props = { items: readonly NavItem[]; open: boolean; onOpenChange: (open: boolean) => void };

/** Right-hand sheet with the page anchors; each link closes the sheet before the page scrolls. */
export function MobileNavSheet({ items, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" closeLabel="Cerrar el menú" aria-label="Menú de secciones">
        <SheetHeader>
          <BrandLogo />
          <SheetTitle>Secciones</SheetTitle>
          <SheetDescription>Ir directamente a una parte de esta página.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Secciones" className="px-6">
          <ul className="grid gap-1" role="list">
            {items.map((item) => (
              <li key={item.href}>
                <SheetClose
                  render={<a href={item.href} />}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-md px-3 font-bold text-heading no-underline transition-colors duration-(--duration-fast) hover:bg-muted"
                >
                  <span>{item.label}</span>
                  <ArrowRightIcon aria-hidden="true" focusable="false" className="size-5 text-icon" />
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
