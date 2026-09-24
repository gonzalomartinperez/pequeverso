"use client";

import { MenuIcon } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import type { NavItem } from "@/components/layout/header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cx } from "@/lib/cx";

const load = () => import("./mobile-nav-sheet");
const NavSheet = lazy(() => load().then((module) => ({ default: module.MobileNavSheet })));
const preload = () => void load();

type Props = { items: readonly NavItem[] };

/**
 * Menu button shown below lg. The sheet (Base UI dialog) is a separate chunk fetched on intent
 * (hover, focus, touch) or first open, so the shared header adds no dialog code to the initial
 * bundle of every page.
 */
export function MobileNav({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const show = () => {
    setMounted(true);
    setOpen(true);
  };
  return (
    <>
      <button
        type="button"
        data-slot="mobile-nav-trigger"
        className={cx(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
        onPointerEnter={preload}
        onFocus={preload}
        onTouchStart={preload}
      >
        <MenuIcon aria-hidden="true" focusable="false" strokeWidth={2.4} />
        <span className="sr-only">Abrir el menú</span>
      </button>
      {mounted ? (
        <Suspense fallback={null}>
          <NavSheet items={items} open={open} onOpenChange={setOpen} />
        </Suspense>
      ) : null}
    </>
  );
}
