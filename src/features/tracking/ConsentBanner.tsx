"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { TrackingAdapter } from "@/features/tracking/adapters/types";
import {
  type ConsentCategory,
  type ConsentChoice,
  onConsentChange,
  readConsent,
  writeConsent,
} from "@/features/tracking/consent";
import { enabledAdapters } from "@/features/tracking/env";
import styles from "./ConsentBanner.module.css";

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
    const tools = adapters.filter((adapter) => adapter.category === id).map((adapter) => adapter.label);
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

type OptionsProps = {
  categories: CategoryInfo[];
  selection: ConsentChoice;
  onToggle: (id: ConsentCategory, value: boolean) => void;
};

function CategoryOptions({ categories, selection, onToggle }: OptionsProps) {
  const prefix = useId();
  return (
    <ul className={styles.details}>
      <li className={styles.option}>
        <input type="checkbox" id={`${prefix}-necessary`} checked disabled readOnly />
        <label htmlFor={`${prefix}-necessary`}>
          <strong>Necesarias:</strong> recordar tu elección de cookies. Siempre activas.
        </label>
      </li>
      {categories.map((category) => (
        <li key={category.id} className={styles.option}>
          <input
            type="checkbox"
            id={`${prefix}-${category.id}`}
            checked={selection[category.id]}
            onChange={(event) => onToggle(category.id, event.target.checked)}
          />
          <label htmlFor={`${prefix}-${category.id}`}>
            <strong>
              {category.title} ({category.tools.join(", ")}):
            </strong>{" "}
            {category.purpose}. Solo con tu permiso.
          </label>
        </li>
      ))}
    </ul>
  );
}

/**
 * Prior-consent banner with equal "Aceptar" / "Rechazar" actions plus "Configurar" for a
 * per-category choice (AEPD 2024 criteria, Meta Business Tools terms). Rendered only when an
 * enabled adapter needs consent; `CookieSettingsLink` reopens it (pv:consent:open).
 */
export function ConsentBanner() {
  const [categories] = useState(() => gatedCategories(enabledAdapters()));
  const [open, setOpen] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [selection, setSelection] = useState<ConsentChoice>(() => choiceFor(categories, false));
  const headingId = useId();
  const descId = useId();

  useEffect(() => {
    if (categories.length === 0) return;
    setOpen(readConsent() === null);
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

  return (
    <section
      className={styles.banner}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={descId}
      data-testid="consent-banner"
    >
      <div className={styles.inner}>
        <h2 id={headingId} className={styles.title}>
          Cookies y medición
        </h2>
        <p id={descId} className={styles.text}>
          Usamos cookies propias necesarias y, solo si aceptas,{" "}
          {joinSpanish(categories.flatMap((category) => category.tools))} para{" "}
          {joinSpanish(categories.map((category) => category.purpose))}. Puedes cambiar tu elección cuando
          quieras desde el pie de página. <Link href="/cookies/">Más información</Link>
        </p>
        {configuring ? (
          <CategoryOptions
            categories={categories}
            selection={selection}
            onToggle={(id, value) => setSelection((current) => ({ ...current, [id]: value }))}
          />
        ) : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => writeConsent(choiceFor(categories, true))}
          >
            Aceptar
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => writeConsent(choiceFor(categories, false))}
          >
            Rechazar
          </button>
          {configuring ? (
            <button type="button" className={styles.secondary} onClick={() => writeConsent(selection)}>
              Guardar selección
            </button>
          ) : (
            <button type="button" className={styles.secondary} onClick={() => setConfiguring(true)}>
              Configurar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
