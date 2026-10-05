"use client";
import { ArrowUp, Square } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { cx } from "@/lib/cx";
import styles from "./assistant.module.css";
import { usePresentation } from "./context";
import { IconButton } from "./parts";

type Props = {
  field: RefObject<HTMLTextAreaElement | null>;
  canSubmit: boolean;
  running: boolean;
  stopping: boolean;
  maxChars: number;
  /** Returns false when the controller refused to start (the text stays in the composer). */
  onSubmit: (text: string) => boolean;
  onStop: () => void;
  /** Question returned after a refusal; a new nonce restores it again. */
  restore: { text: string; nonce: number } | null;
  /** Increments when the composer should take focus (starter chosen, conversation cleared). */
  focusSignal: number;
};

export function Composer({
  field,
  canSubmit,
  running,
  stopping,
  maxChars,
  onSubmit,
  onStop,
  restore,
  focusSignal,
}: Props) {
  const { t, visible } = usePresentation();
  const [draft, setDraft] = useState("");
  const hintId = useId();
  const counterId = useId();
  const remaining = maxChars - draft.length;
  const tooLong = remaining < 0;
  const sendable = canSubmit && draft.trim().length > 0 && !tooLong;

  useEffect(() => {
    if (restore) setDraft(restore.text);
  }, [restore]);

  useEffect(() => {
    // On touch devices focusing would pop the virtual keyboard over the answer.
    if (focusSignal === 0 || !visible || window.matchMedia("(pointer: coarse)").matches) return;
    field.current?.focus({ preventScroll: true });
  }, [focusSignal, visible, field]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the text changes
  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 144)}px`;
  }, [draft, field]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!sendable) return;
    if (onSubmit(draft)) setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter adds a line; never while an IME composition is active.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229)
      return;
    event.preventDefault();
    if (!running) submit();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <div
        className={cx(
          "flex items-end gap-2 rounded-xl border-2 bg-card p-1.5 ps-4 shadow-sm transition-[border-color,box-shadow] duration-(--duration-fast) focus-within:border-ring focus-within:shadow-md",
          tooLong ? "border-coral" : "border-line-strong",
        )}
      >
        <label htmlFor={`${hintId}-field`} className="sr-only">
          {t.composerLabel}
        </label>
        <textarea
          id={`${hintId}-field`}
          ref={field}
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t.composerPlaceholder}
          enterKeyHint="send"
          autoComplete="off"
          aria-describedby={`${hintId} ${counterId}`}
          aria-invalid={tooLong || undefined}
          className={cx(
            "min-h-11 flex-1 resize-none self-center bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-subtle focus-visible:outline-none",
            styles.field,
          )}
        />
        {running ? (
          <IconButton
            label={stopping ? t.stopping : t.stop}
            onClick={onStop}
            disabled={stopping}
            className="border-ink"
          >
            <Square aria-hidden="true" className="size-4 fill-current" />
          </IconButton>
        ) : (
          <IconButton
            key="send"
            label={t.send}
            type="submit"
            disabled={!sendable}
            className="border-transparent bg-navy text-white hover:bg-navy-deep hover:text-white"
          >
            <ArrowUp aria-hidden="true" />
          </IconButton>
        )}
      </div>
      <div
        className={cx(
          "min-h-5 items-start justify-between gap-3 px-2 text-tiny text-subtle",
          remaining <= 100 ? "flex" : "hidden pointer-fine:flex",
        )}
      >
        <p id={hintId} className="hidden pointer-fine:block">
          {t.composerHint}
        </p>
        <p
          id={counterId}
          aria-live="polite"
          className={cx("ms-auto tabular-nums", tooLong && "font-bold text-coral-hover")}
        >
          {tooLong ? t.tooLong(maxChars) : remaining <= 100 ? t.charactersLeft(remaining) : ""}
        </p>
      </div>
    </form>
  );
}
