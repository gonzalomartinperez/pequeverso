"use client";

import { lazy, type ReactNode, Suspense, useState } from "react";
import type { NavItem } from "@/components/layout/header";

const load = () => import("./mobile-nav-sheet");
const NavSheet = lazy(() => load().then((module) => ({ default: module.MobileNavSheet })));
const preload = () => void load();

type Props = {
  items: readonly NavItem[];
  /** Trigger classes, computed on the server (`buttonVariants`) so this island ships no variant table. */
  className: string;
  /** Server-rendered icon and visually hidden label. */
  children: ReactNode;
};

/**
 * Menu button shown below lg. The sheet (Base UI dialog) is a separate chunk fetched on intent
 * (hover, focus, touch) or first open, so the shared header adds no dialog code to the initial
 * bundle of every page.
 */
export function MobileNav({ items, className, children }: Props) {
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
        className={className}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
        onPointerEnter={preload}
        onFocus={preload}
        onTouchStart={preload}
      >
        {children}
      </button>
      {mounted ? (
        <Suspense fallback={null}>
          <NavSheet items={items} open={open} onOpenChange={setOpen} />
        </Suspense>
      ) : null}
    </>
  );
}
