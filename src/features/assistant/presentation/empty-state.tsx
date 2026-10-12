"use client";
import { Sparkles } from "lucide-react";
import styles from "./assistant.module.css";
import { usePresentation } from "./context";
import { chipClass, labelClass } from "./parts";

/** Greeting and opening questions (from the API when it sends them, else approved fallbacks). */
export function EmptyState({
  starters,
  disabled,
  onAsk,
}: {
  starters: string[];
  disabled: boolean;
  onAsk: (question: string) => void;
}) {
  const { t, locale } = usePresentation();
  const questions = locale === "es" && starters.length ? starters : t.starters;
  return (
    <li className="flex flex-col gap-4">
      <div className={styles.greeting}>
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-md bg-navy text-gold">
          <Sparkles className="size-[18px]" />
        </span>
        <h2 className="font-display text-[1.375rem] leading-tight font-bold text-heading">
          {t.greetingTitle}
        </h2>
        <p className="max-w-[60ch] text-small leading-relaxed text-body">{t.greetingBody}</p>
      </div>
      <section aria-label={t.startersLabel} className="flex flex-col gap-2">
        <h3 className={labelClass}>{t.startersLabel}</h3>
        <ul className="flex flex-wrap gap-2">
          {questions.map((question) => (
            <li key={question}>
              <button
                type="button"
                className={`${chipClass} justify-start`}
                aria-label={question}
                title={question}
                disabled={disabled}
                onClick={() => onAsk(question)}
              >
                {Object.hasOwn(t.starterLabels, question) ? t.starterLabels[question] : question}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </li>
  );
}
