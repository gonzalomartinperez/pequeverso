"use client";
import { MessageSquarePlus } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { usePresentation } from "./context";
import { IconButton } from "./parts";

/**
 * "New conversation" with an inline, non-modal confirmation (deleting history is irreversible).
 * Escape closes the confirmation only; it is stopped so the panel does not also minimize.
 */
export function ClearControl({
  disabled,
  clearing,
  onConfirm,
  children,
}: {
  disabled: boolean;
  clearing: boolean;
  onConfirm: () => void;
  /** Keep the confirmation in panel flow, outside the scrollable header. */
  children: (trigger: ReactNode) => ReactNode;
}) {
  const { t } = usePresentation();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    cancel.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !box.current?.contains(event.target) &&
        !trigger.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <>
      {children(
        <IconButton
          ref={trigger}
          label={clearing ? t.clearing : t.clear}
          disabled={disabled || clearing}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((value) => !value)}
        >
          <MessageSquarePlus aria-hidden="true" />
        </IconButton>,
      )}
      {open && (
        <div
          ref={box}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !event.nativeEvent.isComposing && event.keyCode !== 229) {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
          className="on-light flex max-h-[35%] min-w-0 shrink-0 flex-col gap-3 overflow-y-auto border-b border-line bg-card p-4 text-left"
        >
          <div className="flex flex-col gap-1">
            <p id={titleId} className="font-bold text-heading">
              {t.clearConfirmTitle}
            </p>
            <p className="text-small text-body">{t.clearConfirmBody}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              ref={cancel}
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={close}
            >
              {t.clearCancel}
            </button>
            <button
              type="button"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {t.clearConfirm}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
