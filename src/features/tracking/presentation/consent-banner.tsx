"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { explicitGrant } from "@/features/site-analytics/domain/consent.ts";
import {
  type ConsentCategory,
  type ConsentChoice,
  onConsentChange,
  readConsent,
  writeConsent,
} from "@/features/tracking/adapters/consent.ts";
import { enabledAdapters } from "@/features/tracking/adapters/env.ts";
import type { TrackingAdapter } from "@/features/tracking/adapters/types.ts";

type CategoryInfo = {
  id: ConsentCategory;
  title: string;
  purpose: string;
  tools: string[];
};

const CATEGORY_ORDER: readonly ConsentCategory[] = ["analytics", "marketing"];
const CATEGORY_COPY: Record<ConsentCategory, Pick<CategoryInfo, "title" | "purpose">> = {
  analytics: { title: "Analítica", purpose: "entender qué páginas se visitan" },
  marketing: {
    title: "Marketing",
    purpose: "medir nuestras campañas y el interés en los productos",
  },
};

function gatedCategories(adapters: TrackingAdapter[]): CategoryInfo[] {
  return CATEGORY_ORDER.flatMap((id) => {
    const tools = [
      ...new Set([
        ...adapters.filter((adapter) => adapter.category === id).map((adapter) => adapter.label),
        ...(process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true" && id === "analytics"
          ? ["Analítica del sitio Pequeverso"]
          : []),
      ]),
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

const FIRST_PAINT_TIMEOUT_MS = 2500;

/**
 * Runs `callback` after the first paint (two animation frames) once the browser is idle
 * (`requestIdleCallback`, with a timeout fallback), so the banner is never the LCP element nor
 * a layout shift. Returns a canceller.
 */
function afterFirstPaint(callback: () => void): () => void {
  let cancelled = false;
  let frame = 0;
  let idle = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    if (!cancelled) callback();
  };
  frame = window.requestAnimationFrame(() => {
    frame = window.requestAnimationFrame(() => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(run, { timeout: FIRST_PAINT_TIMEOUT_MS });
      else timer = setTimeout(run, 200);
    });
  });
  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
    if (idle) window.cancelIdleCallback(idle);
    clearTimeout(timer);
  };
}

const BANNER =
  "fixed inset-x-3 bottom-[calc(var(--space-3)+env(safe-area-inset-bottom))] z-90 border border-white bg-card mx-auto max-h-[60dvh] max-w-3xl overflow-y-auto overscroll-contain rounded-xl p-5 shadow-float ring-1 ring-navy/10 sm:p-6";
const INNER = "on-light grid w-full gap-3";
const TITLE = "font-sans text-h3 font-extrabold text-heading";
const TEXT = "max-w-[70ch] text-small";
const ACTIONS = "flex flex-wrap gap-2 pt-1 [&>button]:rounded-pill";
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
        <input
          type="checkbox"
          id={`${prefix}-necessary`}
          className={CHECKBOX}
          checked
          disabled
          readOnly
        />
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
            {category.purpose}.{" "}
            {process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true" &&
            category.id === "analytics"
              ? "Se activa al aceptar o guardar tu selección."
              : "Solo se activa si la marcas."}
          </label>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  /** Button classes computed on the server (`buttonVariants`), keeping variant tables out of the layout chunk. */
  classes: { primary: string };
};

/**
 * Cookie banner with three equal actions: "Aceptar", "Rechazar" and "Configurar" (per-category
 * choice). Nothing gated runs before the choice (`DEFAULT_CHOICE`, prior opt-in); the choice is
 * kept for six months. Shown on first visit, after first paint, only when an enabled adapter
 * has a gated category; `CookieSettingsLink` reopens it (pv:consent:open). With no gated integration it
 * opens on request as a notice that only necessary cookies are used.
 */
export function ConsentBanner({ classes }: Props) {
  const [categories] = useState(() => gatedCategories(enabledAdapters()));
  const [open, setOpen] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [selection, setSelection] = useState<ConsentChoice>(() => choiceFor(categories, false));
  const headingId = useId();
  const descId = useId();

  useEffect(() => {
    let cancelFirstVisit = () => {};
    if (categories.length > 0) {
      const stored = readConsent();
      const needsChoice =
        stored === null ||
        (process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true" &&
          stored.analytics &&
          !explicitGrant(stored, Date.now()));
      // After first paint: the banner must not be the LCP element nor shift the layout.
      if (needsChoice) cancelFirstVisit = afterFirstPaint(() => setOpen(true));
    }
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
      cancelFirstVisit();
      window.removeEventListener("pv:consent:open", reopen);
      unsubscribe();
    };
  }, [categories]);

  function persist(choice: ConsentChoice) {
    // Withdraw this channel BEFORE a potentially failing storage write. Vendor behavior is unchanged.
    if (process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true" && !choice.analytics)
      window.dispatchEvent(new Event("pv:site-analytics:withdraw"));
    writeConsent(choice);
  }

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
            Este sitio solo usa cookies propias necesarias para funcionar y no requieren tu permiso.
            No hay integraciones de medición ni de marketing activas, así que no hay nada que
            configurar. <Link href="/cookies/">Más información</Link>
          </p>
          <div className={ACTIONS}>
            <button type="button" className={classes.primary} onClick={() => setOpen(false)}>
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
          Tu privacidad, tu elección
        </h2>
        <p id={descId} className={TEXT}>
          Usamos solo lo necesario para que el sitio funcione. Si aceptas, también usamos{" "}
          {joinSpanish(categories.flatMap((category) => category.tools))} para{" "}
          {joinSpanish(categories.map((category) => category.purpose))}. Puedes cambiarlo cuando
          quieras. <Link href="/cookies/">Más información</Link>
        </p>
        {configuring ? (
          <CategoryOptions
            categories={categories}
            selection={selection}
            onToggle={(id, value) => setSelection((current) => ({ ...current, [id]: value }))}
          />
        ) : null}
        <div className={ACTIONS}>
          <button
            type="button"
            className={classes.primary}
            onClick={() => persist(choiceFor(categories, true))}
          >
            Aceptar
          </button>
          <button
            type="button"
            className={classes.primary}
            onClick={() => persist(choiceFor(categories, false))}
          >
            Rechazar
          </button>
          {configuring ? (
            <button type="button" className={classes.primary} onClick={() => persist(selection)}>
              Guardar selección
            </button>
          ) : (
            <button type="button" className={classes.primary} onClick={() => setConfiguring(true)}>
              Configurar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
