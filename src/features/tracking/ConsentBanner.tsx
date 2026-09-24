"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import type { TrackingAdapter } from "@/features/tracking/adapters/types";
import {
  type ConsentCategory,
  type ConsentChoice,
  onConsentChange,
  readConsent,
  writeConsent,
} from "@/features/tracking/consent";
import { enabledAdapters } from "@/features/tracking/env";

type CategoryInfo = {
  id: ConsentCategory;
  title: string;
  purpose: string;
  tools: string[];
};

const CATEGORY_ORDER: readonly ConsentCategory[] = ["analytics", "marketing"];
const CATEGORY_COPY: Record<ConsentCategory, Pick<CategoryInfo, "title" | "purpose">> = {
  analytics: { title: "Analítica", purpose: "entender qué páginas se visitan" },
  marketing: { title: "Marketing", purpose: "medir nuestras campañas y el interés en el producto" },
};

function gatedCategories(adapters: TrackingAdapter[]): CategoryInfo[] {
  return CATEGORY_ORDER.flatMap((id) => {
    const tools = [
      ...new Set(adapters.filter((adapter) => adapter.category === id).map((adapter) => adapter.label)),
    ];
    return tools.length > 0 ? [{ id, ...CATEGORY_COPY[id], tools }] : [];
  });
}

function choiceFor(categories: CategoryInfo[], value: boolean): ConsentChoice {
  const choice: ConsentChoice = { analytics: false, marketing: false };
  for (const category of categories) choice[category.id] = value;
  return choice;
}

function joinSpanish(items: string[]): string {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

const BANNER =
  "fixed inset-x-0 bottom-0 z-90 border-t border-border bg-card px-(--gutter) pt-4 pb-[calc(var(--space-4)+env(safe-area-inset-bottom))] shadow-lg";
const INNER = "mx-auto grid w-full max-w-(--page-max) gap-3";
const TITLE = "font-sans text-h3 font-extrabold text-heading";
const TEXT = "max-w-[70ch] text-small";
const ACTIONS = "flex flex-wrap gap-2";
const PRIMARY = buttonVariants({ variant: "secondary", size: "sm" });
const SECONDARY = buttonVariants({ variant: "ghost", size: "sm" });
const CHECKBOX = "mt-0.5 size-5 shrink-0 accent-navy";

type OptionsProps = {
  categories: CategoryInfo[];
  selection: ConsentChoice;
  onToggle: (id: ConsentCategory, value: boolean) => void;
};

function CategoryOptions({ categories, selection, onToggle }: OptionsProps) {
  const prefix = useId();
  return (
    <ul className="grid gap-2 text-small text-body">
      <li className="flex items-start gap-2">
        <input type="checkbox" id={`${prefix}-necessary`} className={CHECKBOX} checked disabled readOnly />
        <label htmlFor={`${prefix}-necessary`} className="min-h-6">
          <strong>Necesarias:</strong> recordar tu elección de cookies. Siempre activas.
        </label>
      </li>
      {categories.map((category) => (
        <li key={category.id} className="flex items-start gap-2">
          <input
            type="checkbox"
            id={`${prefix}-${category.id}`}
            className={CHECKBOX}
            checked={selection[category.id]}
            onChange={(event) => onToggle(category.id, event.target.checked)}
          />
          <label htmlFor={`${prefix}-${category.id}`} className="min-h-6">
            <strong>
              {category.title} ({category.tools.join(", ")}):
            </strong>{" "}
            {category.purpose}. Activa salvo que la desmarques.
          </label>
        </li>
      ))}
    </ul>
  );
}

/**
 * Cookie banner with equal "Aceptar" / "Rechazar" actions plus "Configurar" for a per-category
 * choice. Measurement runs by default (`DEFAULT_CHOICE`); "Rechazar" withdraws it and the choice
 * is kept for six months. Shown on first visit only when an enabled adapter has a gated
 * category; `CookieSettingsLink` reopens it (pv:consent:open). With no gated integration it
 * opens on request as a notice that only necessary cookies are used.
 */
export function ConsentBanner() {
  const [categories] = useState(() => gatedCategories(enabledAdapters()));
  const [open, setOpen] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [selection, setSelection] = useState<ConsentChoice>(() => choiceFor(categories, true));
  const headingId = useId();
  const descId = useId();

  useEffect(() => {
    if (categories.length > 0) setOpen(readConsent() === null);
    const reopen = () => {
      const current = readConsent();
      if (current) setSelection({ analytics: current.analytics, marketing: current.marketing });
      setOpen(true);
    };
    window.addEventListener("pv:consent:open", reopen);
    const unsubscribe = onConsentChange(() => {
      setOpen(false);
      setConfiguring(false);
    });
    return () => {
      window.removeEventListener("pv:consent:open", reopen);
      unsubscribe();
    };
  }, [categories]);

  if (!open) return null;

  if (categories.length === 0) {
    return (
      <section
        className={BANNER}
        role="dialog"
        aria-modal="false"
        aria-labelledby={headingId}
        aria-describedby={descId}
        data-testid="consent-banner"
        data-mode="notice"
      >
        <div className={INNER}>
          <h2 id={headingId} className={TITLE}>
            Cookies
          </h2>
          <p id={descId} className={TEXT}>
            Este sitio solo usa cookies propias necesarias para funcionar y no requieren tu permiso. No hay
            integraciones de medición ni de marketing activas, así que no hay nada que configurar.{" "}
            <Link href="/cookies/">Más información</Link>
          </p>
          <div className={ACTIONS}>
            <button type="button" className={PRIMARY} onClick={() => setOpen(false)}>
              Entendido
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={BANNER}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={descId}
      data-testid="consent-banner"
    >
      <div className={INNER}>
        <h2 id={headingId} className={TITLE}>
          Cookies y medición
        </h2>
        <p id={descId} className={TEXT}>
          Usamos cookies necesarias y {joinSpanish(categories.flatMap((category) => category.tools))} para{" "}
          {joinSpanish(categories.map((category) => category.purpose))}. Si rechazas, la medición se
          desactiva; puedes cambiar tu elección en el pie de página.{" "}
          <Link href="/cookies/">Más información</Link>
        </p>
        {configuring ? (
          <CategoryOptions
            categories={categories}
            selection={selection}
            onToggle={(id, value) => setSelection((current) => ({ ...current, [id]: value }))}
          />
        ) : null}
        <div className={ACTIONS}>
          <button type="button" className={PRIMARY} onClick={() => writeConsent(choiceFor(categories, true))}>
            Aceptar
          </button>
          <button
            type="button"
            className={PRIMARY}
            onClick={() => writeConsent(choiceFor(categories, false))}
          >
            Rechazar
          </button>
          {configuring ? (
            <button type="button" className={SECONDARY} onClick={() => writeConsent(selection)}>
              Guardar selección
            </button>
          ) : (
            <button type="button" className={SECONDARY} onClick={() => setConfiguring(true)}>
              Configurar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
