"use client";
import { AlertCircle, Check, CircleStop, Copy, RotateCcw, WifiOff, X } from "lucide-react";
import { memo, type ReactNode, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cx } from "@/lib/cx";
import type { Outcome, Pending } from "../domain/conversation";
import type { ErrorCode, Message } from "../domain/models";
import { FollowUps, Links, Notices, Sources } from "./answer-extras";
import styles from "./assistant.module.css";
import { usePresentation } from "./context";
import { Callout, labelClass } from "./parts";
import { ProductSection } from "./products";
import { RichTextView } from "./rich-text-view";

function UserMessage({ message, enter = false }: { message: Message; enter?: boolean }) {
  const { t } = usePresentation();
  return (
    <li className={cx("flex justify-end", enter && styles.enter)}>
      <div className="on-navy max-w-[85%] rounded-lg rounded-br-sm bg-navy px-4 py-2.5 text-white shadow-sm">
        <h2 className="sr-only">{t.you}</h2>
        <p className="whitespace-pre-wrap text-white [overflow-wrap:anywhere]">{message.content}</p>
      </div>
    </li>
  );
}

function AssistantFrame({ children, busy = false }: { children: ReactNode; busy?: boolean }) {
  const { t } = usePresentation();
  return (
    <li className="flex min-w-0 flex-col gap-4" aria-busy={busy || undefined}>
      <h2 className="sr-only">{t.assistant}</h2>
      {children}
    </li>
  );
}

type CopyState = "idle" | "copied" | "failed";

/** Copies the answer text; the label reports the real clipboard result, then resets. */
function CopyButton({ text }: { text: string }) {
  const { t } = usePresentation();
  const [state, setState] = useState<CopyState>("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);
  const label = state === "copied" ? t.copied : state === "failed" ? t.copyFailed : t.copy;
  return (
    <button
      type="button"
      onClick={() => {
        if (!navigator.clipboard) {
          setState("failed");
          return;
        }
        navigator.clipboard.writeText(text).then(
          () => setState("copied"),
          () => setState("failed"),
        );
      }}
      className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-pill px-3 text-tiny font-bold text-subtle hover:bg-foreground/5 hover:text-heading"
    >
      {state === "copied" ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      <span aria-live="polite">{label}</span>
    </button>
  );
}

type AssistantMessageProps = {
  message: Message;
  followUps: boolean;
  onFollowUp: (question: string) => void;
};

const AssistantMessage = memo(function AssistantMessage({
  message,
  followUps,
  onFollowUp,
}: AssistantMessageProps) {
  return (
    <AssistantFrame>
      {/* No entrance motion: the final answer replaces the visible draft in place. */}
      {message.content && (
        <div lang={message.language ?? undefined}>
          <RichTextView text={message.content} />
        </div>
      )}
      <Notices notices={message.notices} />
      <ProductSection products={message.products} resources={message.resources} />
      <Links links={message.links} />
      <Sources sources={message.sources} />
      {followUps && (
        <div lang={message.language ?? undefined}>
          <FollowUps items={message.followUps} disabled={false} onSelect={onFollowUp} />
        </div>
      )}
      {message.content && <CopyButton text={message.content} />}
    </AssistantFrame>
  );
});

type MessageListProps = {
  messages: Message[];
  /** Follow-ups are offered only on the latest answer and only while a question can be sent. */
  followUpsEnabled: boolean;
  onFollowUp: (question: string) => void;
};

/**
 * Committed transcript. Its props do not change while an answer streams (the reducer keeps the
 * same `messages` array), so tokens re-render only the streaming draft below it.
 */
export const MessageList = memo(function MessageList({
  messages,
  followUpsEnabled,
  onFollowUp,
}: MessageListProps) {
  const last = messages.at(-1);
  return (
    <>
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage
            key={message.id}
            message={message}
            followUps={followUpsEnabled && message === last}
            onFollowUp={onFollowUp}
          />
        ),
      )}
    </>
  );
});

export function PendingQuestion({ pending }: { pending: Pending }) {
  return pending.question ? <UserMessage message={pending.question} enter /> : null;
}

/** The live draft: same renderer as the final answer, so completion causes no format jump. */
export function StreamingAnswer({ pending }: { pending: Pending }) {
  const { t } = usePresentation();
  if (pending.answered) return null;
  return (
    <AssistantFrame busy>
      {pending.draft ? (
        <div className="relative flex flex-col gap-2">
          {/* The draft is provisional until the API confirms the stored answer (message.completed). */}
          <p className={labelClass}>{pending.stopping ? t.stopping : t.inProgressLabel}</p>
          <RichTextView text={pending.draft} />
          {!pending.stopping && (
            <span
              aria-hidden="true"
              className={cx(
                "ms-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-teal align-baseline",
                styles.caret,
              )}
            />
          )}
        </div>
      ) : (
        <p className="flex min-h-7 items-center gap-2 text-small text-subtle">
          <span aria-hidden="true" className="flex gap-1">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className={cx("size-1.5 rounded-full bg-icon", styles.dot)}
                style={{ animationDelay: `${dot * 160}ms` }}
              />
            ))}
          </span>
          {pending.stopping ? t.stopping : t.thinking}
        </p>
      )}
    </AssistantFrame>
  );
}

function outcomeCopy(outcome: Outcome, t: ReturnType<typeof usePresentation>["t"]) {
  if (outcome.kind === "cancelled") return { title: t.cancelledTitle, detail: null, Icon: CircleStop };
  if (outcome.kind === "interrupted") return { title: t.interruptedTitle, detail: null, Icon: WifiOff };
  return { title: t.failedTitle, detail: t.errors[outcome.code], Icon: AlertCircle };
}

export function OutcomeView({
  outcome,
  canRetry,
  onRetry,
  onDismiss,
}: {
  outcome: Outcome;
  canRetry: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const { t } = usePresentation();
  const { title, detail, Icon } = outcomeCopy(outcome, t);
  const retryable = outcome.kind !== "failed" || outcome.retryable;
  return (
    <AssistantFrame>
      {outcome.partial && (
        <div className="flex flex-col gap-2">
          <p className={labelClass}>{t.partialLabel}</p>
          <RichTextView text={outcome.partial} className="border-s-2 border-line-strong ps-3 opacity-80" />
        </div>
      )}
      <Callout tone={outcome.kind === "cancelled" ? "info" : "danger"}>
        <Icon aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-bold text-heading">{title}</p>
          {detail && <p>{detail}</p>}
        </div>
      </Callout>
      <div className="flex flex-wrap gap-2">
        {retryable && (
          <button
            type="button"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
            onClick={onRetry}
            disabled={!canRetry}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {t.retry}
          </button>
        )}
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          onClick={onDismiss}
        >
          <X aria-hidden="true" className="size-4" />
          {t.dismiss}
        </button>
      </div>
    </AssistantFrame>
  );
}

export function RefusalView({ code, onDismiss }: { code: ErrorCode; onDismiss: () => void }) {
  const { t } = usePresentation();
  return (
    <li>
      <Callout tone="danger">
        <AlertCircle aria-hidden="true" />
        <p className="flex-1 self-center">{t.errors[code]}</p>
        <button
          type="button"
          aria-label={t.dismiss}
          onClick={onDismiss}
          className={cx(buttonVariants({ variant: "ghost", size: "icon" }), "-my-2 -me-2 border-transparent")}
        >
          <X aria-hidden="true" />
        </button>
      </Callout>
    </li>
  );
}
