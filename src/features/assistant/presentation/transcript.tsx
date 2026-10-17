"use client";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import styles from "./assistant.module.css";
import { usePresentation } from "./context";

const STICK_THRESHOLD_PX = 72;

/**
 * Scrollable conversation. It follows new content only while the reader is already near the
 * bottom; scrolling up to reread stops following (no scroll hijacking) until the reader returns,
 * uses "jump to latest" or sends a question (`followSignal`). Growth is observed with a
 * ResizeObserver, so streaming adds no per-token scroll work beyond one layout read.
 */
export function Transcript({
  children,
  followSignal,
  busy,
  empty,
  inactive,
  onJumpChange,
}: {
  children: ReactNode;
  followSignal: number;
  busy: boolean;
  /** The greeting and starters read from the top; following starts with the first message. */
  empty: boolean;
  /** A clear-history decision temporarily owns the conversation controls. */
  inactive: boolean;
  /** Presentation-only registration: the header owns the control, this reader owns scrolling. */
  onJumpChange: (action: (() => void) | null) => void;
}) {
  const { t } = usePresentation();
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLOListElement>(null);
  const stick = useRef(true);
  const lastTop = useRef(0);
  const emptyRef = useRef(empty);
  emptyRef.current = empty;
  const [showJump, setShowJump] = useState(false);

  const toBottom = useCallback((smooth = false) => {
    const element = scroller.current;
    if (!element || emptyRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ top: element.scrollHeight, behavior: smooth && !reduce ? "smooth" : "auto" });
    // Scroll events can be coalesced: remember the actual programmatic position immediately.
    lastTop.current = element.scrollTop;
  }, []);

  const updateFollow = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    // The greeting is read from the top; a "latest answer" action has no meaning before a message.
    if (emptyRef.current) {
      stick.current = true;
      lastTop.current = element.scrollTop;
      setShowJump(false);
      return;
    }
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distance <= STICK_THRESHOLD_PX) stick.current = true;
    else if (element.scrollTop < lastTop.current) stick.current = false;
    lastTop.current = element.scrollTop;
    setShowJump(!stick.current);
  }, []);

  const jumpToLatest = useCallback(() => {
    stick.current = true;
    setShowJump(false);
    toBottom(true);
    // The header action disappears once following resumes. Keep focus in the conversation,
    // without focusing the composer and opening a touch keyboard over the response.
    scroller.current?.focus({ preventScroll: true });
  }, [toBottom]);

  useLayoutEffect(() => {
    onJumpChange(showJump && !inactive ? jumpToLatest : null);
    return () => onJumpChange(null);
  }, [showJump, inactive, jumpToLatest, onJumpChange]);

  useLayoutEffect(() => {
    toBottom();
  }, [toBottom]);

  useEffect(() => {
    if (followSignal === 0) return;
    stick.current = true;
    setShowJump(false);
    toBottom();
  }, [followSignal, toBottom]);

  useEffect(() => {
    const element = scroller.current;
    const inner = content.current;
    if (!element || !inner) return;
    // Only a scroll *up* by the reader stops following; content growing between a programmatic
    // scroll and its event must not be mistaken for the reader leaving the bottom.
    const observer = new ResizeObserver(() => {
      // A resize may arrive before the reader's scroll event; never pull that reader back down.
      updateFollow();
      if (stick.current) toBottom();
      else setShowJump(true);
    });
    element.addEventListener("scroll", updateFollow, { passive: true });
    observer.observe(inner);
    return () => {
      element.removeEventListener("scroll", updateFollow);
      observer.disconnect();
    };
  }, [toBottom, updateFollow]);

  return (
    <div inert={inactive} className="relative min-h-0 flex-1">
      <div ref={scroller} tabIndex={-1} className={cx("cq h-full overflow-y-auto", styles.transcript)}>
        <ol
          ref={content}
          aria-label={t.transcriptLabel}
          aria-busy={busy || undefined}
          className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-3 cq-md:px-5"
        >
          {children}
        </ol>
      </div>
    </div>
  );
}

/** Polite status announcements for state changes (never per token); silent while minimized. */
export function Announcer({ message }: { message: string }) {
  const { visible } = usePresentation();
  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {visible ? message : ""}
    </p>
  );
}
