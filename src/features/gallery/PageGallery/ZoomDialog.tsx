"use client";

import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { KeyboardEvent } from "react";

export type Zoom = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

const TABBABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab and Shift+Tab cycling inside the popup. Base UI's focus guards do not redirect focus
 * in WebKit when it is moved with Alt+Tab (Safari's default for buttons), so focus escaped.
 */
function trapTab(event: KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== "Tab") return;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)];
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  const active = document.activeElement;
  if (event.shiftKey ? active === first || !event.currentTarget.contains(active) : active === last) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

type Props = {
  open: boolean;
  /** Last zoomed page; kept while the dialog animates out. */
  zoom: Zoom | null;
  /** Visible heading (e.g. "Página real del kit"); the page's alt text stays the image's name. */
  title?: string | undefined;
  onClose: () => void;
};

/**
 * Enlarged worksheet on the Base UI dialog (loaded on first zoom): a full-viewport grid centres
 * the popup at any size, the image is contained within the viewport minus safe-area padding,
 * focus is trapped, Escape and the close button dismiss it, and the page scroll is locked.
 */
export function ZoomDialog({ open, zoom, title, onClose }: Props) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-70 bg-navy-deep/75 backdrop-blur-sm transition-opacity duration-(--duration) ease-out data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-70 grid place-items-center pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
          <Dialog.Popup
            data-slot="gallery-zoom"
            onKeyDown={trapTab}
            className="relative grid max-h-full w-fit max-w-[min(1040px,100%)] gap-3 overflow-auto rounded-xl bg-[linear-gradient(160deg,var(--pv-white),var(--pv-celeste))] p-3 shadow-[0_40px_120px_-20px_oklch(0.15_0.08_256/70%)] outline-none ring-1 ring-white/80 transition-[opacity,scale,translate] duration-(--duration-reveal) ease-emphasis data-ending-style:translate-y-2 data-ending-style:scale-96 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:scale-96 data-starting-style:opacity-0 sm:p-5"
          >
            {zoom ? (
              <>
                <Dialog.Title
                  className={
                    title
                      ? "flex min-h-11 items-center gap-2 pr-14 pl-1 font-sans text-small font-extrabold tracking-[0.08em] text-teal-text uppercase before:size-2 before:rounded-full before:bg-teal"
                      : "sr-only"
                  }
                >
                  {title ?? zoom.alt}
                </Dialog.Title>
                <img
                  className="mx-auto max-h-[calc(100dvh-10rem)] w-auto max-w-full rounded-lg bg-white object-contain shadow-md"
                  src={zoom.src}
                  srcSet={zoom.srcSet}
                  sizes="90vw"
                  width={zoom.width}
                  height={zoom.height}
                  alt={zoom.alt}
                />
                <Dialog.Description className="px-2 pb-1 text-center text-small font-bold text-ink text-balance sm:text-base">
                  {zoom.caption}
                </Dialog.Description>
              </>
            ) : null}
            <Dialog.Close className="glass absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full text-navy shadow-md transition-[scale,background-color] duration-(--duration-fast) ease-out hover:bg-white active:scale-95 sm:top-4 sm:right-4">
              <XIcon aria-hidden="true" focusable="false" />
              <span className="sr-only">Cerrar</span>
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
