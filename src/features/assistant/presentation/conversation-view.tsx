"use client";
import { Info } from "lucide-react";
import Link from "next/link";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { Assistant } from "../application/assistant";
import { announcement, type ConversationState, canSubmit, type Phase } from "../domain/conversation";
import styles from "./assistant.module.css";
import { Composer } from "./composer";
import { usePresentation } from "./context";
import { EmptyState } from "./empty-state";
import { MessageList, OutcomeView, PendingQuestion, RefusalView, StreamingAnswer } from "./messages";
import { Connecting, Offline, Unavailable } from "./panel-states";
import { Callout } from "./parts";
import { Announcer, Transcript } from "./transcript";

/** One polite announcement per phase change (never per token). */
function useAnnouncement(current: Phase): string {
  const { t } = usePresentation();
  const [notice, setNotice] = useState<ReturnType<typeof announcement>>(null);
  const previous = useRef(current.kind);
  useEffect(() => {
    const before = previous.current;
    previous.current = current.kind;
    const next = announcement(before, current);
    if (next) setNotice(next);
  }, [current]);
  const copy = {
    thinking: t.thinking,
    stopped: t.answerStopped,
    interrupted: t.answerInterrupted,
    failed: t.answerFailed,
    ready: t.answerReady,
  } as const;
  return notice ? copy[notice] : "";
}

/** The single public conversation implementation of Pequeverso. */
export function ConversationView({
  assistant,
  state,
  phase,
  field,
  confirming,
}: {
  assistant: Assistant;
  state: ConversationState;
  phase: Phase;
  field: RefObject<HTMLTextAreaElement | null>;
  confirming: boolean;
}) {
  const { t, privacyPath, onNavigate } = usePresentation();
  const [follow, setFollow] = useState(0);
  const [focus, setFocus] = useState(0);
  const announcement = useAnnouncement(phase);
  const ready = canSubmit(state);

  const ask = useCallback(
    (question: string) => {
      const sent = assistant.submit(question);
      if (sent) setFollow((value) => value + 1);
      return sent;
    },
    [assistant],
  );
  const askAndFocus = useCallback(
    (question: string) => {
      if (ask(question)) setFocus((value) => value + 1);
    },
    [ask],
  );

  // After the conversation is cleared, focus returns to the composer instead of a disabled button.
  const wasClearing = useRef(false);
  useEffect(() => {
    if (
      wasClearing.current &&
      !state.clearing &&
      (document.activeElement === document.body || document.activeElement?.id === "pv-assistant-panel")
    )
      setFocus((value) => value + 1);
    wasClearing.current = state.clearing;
  }, [state.clearing]);

  if (phase.kind === "initializing" && state.messages.length === 0) return <Connecting />;
  if (state.session === "failed" && state.availability.status === "available")
    return <Offline onReconnect={assistant.reconnect} />;

  const pending = state.pending;
  const empty = state.messages.length === 0 && !pending && !state.outcome;
  return (
    <>
      <Transcript followSignal={follow} busy={pending !== null} empty={empty} inactive={confirming}>
        {empty && state.availability.status === "available" && (
          <EmptyState starters={state.starters} disabled={!ready} onAsk={askAndFocus} />
        )}
        {phase.kind === "expired" && (
          <li>
            <Callout tone="notice">
              <Info aria-hidden="true" />
              <p>{t.expiredNotice}</p>
            </Callout>
          </li>
        )}
        <MessageList
          messages={state.messages}
          followUpsEnabled={ready && !state.outcome}
          onFollowUp={askAndFocus}
        />
        {pending && <PendingQuestion pending={pending} />}
        {pending && <StreamingAnswer pending={pending} />}
        {state.outcome && !pending && (
          <OutcomeView
            outcome={state.outcome}
            canRetry={ready}
            onRetry={() => {
              if (assistant.retry()) setFollow((value) => value + 1);
            }}
            onDismiss={assistant.dismiss}
          />
        )}
        {state.refusal && !pending && <RefusalView code={state.refusal} onDismiss={assistant.dismiss} />}
      </Transcript>
      <div hidden={confirming} className={`border-t border-line bg-cream px-3 pt-3 ${styles.composer}`}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          {state.availability.status === "unavailable" ? (
            <Unavailable availability={state.availability} />
          ) : (
            <Composer
              field={field}
              canSubmit={ready}
              running={pending !== null}
              stopping={pending?.stopping ?? false}
              maxChars={state.limits?.maxMessageChars ?? 600}
              onSubmit={ask}
              onStop={assistant.stop}
              restore={state.restore}
              focusSignal={focus}
            />
          )}
          <p className="px-2 text-tiny text-subtle">
            {t.privacyNote}
            <Link
              href={privacyPath}
              onClick={onNavigate}
              className="font-bold text-link underline underline-offset-2"
            >
              {t.privacyLink}
            </Link>
          </p>
        </div>
      </div>
      <Announcer message={announcement} />
    </>
  );
}
