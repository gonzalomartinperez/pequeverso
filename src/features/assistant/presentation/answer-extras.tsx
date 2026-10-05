"use client";
import { ChevronDown, FileText, Info, MessageCircleQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cx } from "@/lib/cx";
import type { Link, Notice, Source } from "../domain/models";
import { usePresentation } from "./context";
import { Callout, chipClass, labelClass, SafeLink } from "./parts";

export function Sources({ sources }: { sources: Source[] }) {
  const { t } = usePresentation();
  if (!sources.length) return null;
  return (
    <details className="group/sources rounded-md border border-line bg-card">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-small font-bold text-heading [&::-webkit-details-marker]:hidden">
        <FileText aria-hidden="true" className="size-4 text-icon" />
        <span>{t.sourcesLabel(sources.length)}</span>
        <span className="sr-only">. {t.sourcesHint}</span>
        <ChevronDown
          aria-hidden="true"
          className="ms-auto size-4 text-subtle transition-transform duration-(--duration-fast) group-open/sources:rotate-180"
        />
      </summary>
      <ul className="flex flex-col gap-1 border-t border-line px-3 py-2">
        {sources.map((source) => (
          <li key={source.id}>
            <SafeLink
              href={source.url}
              className="inline-flex min-h-9 items-center gap-1.5 text-small font-bold text-link underline decoration-1 underline-offset-3 [overflow-wrap:anywhere] hover:text-link-hover"
            >
              {source.title}
            </SafeLink>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function Links({ links }: { links: Link[] }) {
  const { t } = usePresentation();
  if (!links.length) return null;
  return (
    <nav aria-label={t.linksLabel}>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.id} className="max-w-full">
            <SafeLink
              href={link.url}
              className={cx(
                buttonVariants({ variant: "outline", size: "sm" }),
                "max-w-full whitespace-normal",
              )}
            >
              {link.label}
            </SafeLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function FollowUps({
  items,
  disabled,
  onSelect,
}: {
  items: string[];
  disabled: boolean;
  onSelect: (question: string) => void;
}) {
  const { t } = usePresentation();
  if (!items.length) return null;
  return (
    <section aria-label={t.followUpsLabel} className="flex flex-col gap-2">
      <h3 className={labelClass}>
        <MessageCircleQuestion aria-hidden="true" className="size-4 text-icon" />
        {t.followUpsLabel}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="max-w-full">
            <button type="button" className={chipClass} disabled={disabled} onClick={() => onSelect(item)}>
              {item}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Only notices that add information are shown: a refused payment message and a replaced answer
 * are already explained by the answer text itself.
 */
const SHOWN_NOTICES: readonly Notice[] = ["contact_data_redacted", "language_unsupported"];

export function Notices({ notices }: { notices: Notice[] }) {
  const { t } = usePresentation();
  const shown = notices.filter((notice) => SHOWN_NOTICES.includes(notice));
  if (!shown.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {shown.map((notice) => (
        <Callout key={notice} tone="notice">
          <Info aria-hidden="true" />
          <p>{t.notices[notice]}</p>
        </Callout>
      ))}
    </div>
  );
}
