"use client";
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
  const { t } = usePresentation();
  const questions = starters.length ? starters : t.starters;
  return (
    <li className="flex flex-col gap-5 pt-2">
      <div className="flex flex-col items-start gap-2">
        <h2 className="font-display text-h3 font-bold text-heading">{t.greetingTitle}</h2>
        <p className="max-w-[60ch] text-base text-body">{t.greetingBody}</p>
      </div>
      <section aria-label={t.startersLabel} className="flex flex-col gap-2">
        <h3 className={labelClass}>{t.startersLabel}</h3>
        <ul className="grid gap-2 cq-lg:grid-cols-2">
          {questions.map((question) => (
            <li key={question}>
              <button
                type="button"
                className={`${chipClass} w-full justify-start`}
                disabled={disabled}
                onClick={() => onAsk(question)}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </li>
  );
}
