"use client";

import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cx } from "@/lib/cx";

export type Zoom = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

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
        <Dialog.Backdrop className="fixed inset-0 z-70 bg-navy-deep/72 transition-opacity duration-(--duration) ease-out data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-70 grid place-items-center pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
          <Dialog.Popup
            data-slot="gallery-zoom"
            className="relative grid max-h-full w-fit max-w-[min(1000px,100%)] gap-3 overflow-auto rounded-lg bg-white p-4 shadow-lg outline-none transition-[opacity,scale] duration-(--duration) ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-6"
          >
            {zoom ? (
              <>
                <Dialog.Title
                  className={
                    title
                      ? "pr-12 font-sans text-small font-extrabold tracking-[0.06em] text-teal-text uppercase"
                      : "sr-only"
                  }
                >
                  {title ?? zoom.alt}
                </Dialog.Title>
                <img
                  className="mx-auto max-h-[calc(100dvh-9rem)] w-auto max-w-full rounded-md object-contain"
                  src={zoom.src}
                  srcSet={zoom.srcSet}
                  sizes="90vw"
                  width={zoom.width}
                  height={zoom.height}
                  alt={zoom.alt}
                />
                <Dialog.Description className="text-center font-bold text-ink">
                  {zoom.caption}
                </Dialog.Description>
              </>
            ) : null}
            <Dialog.Close
              className={cx(
                buttonVariants({ variant: "secondary", size: "icon" }),
                "absolute top-3 right-3 rounded-full",
              )}
            >
              <XIcon aria-hidden="true" focusable="false" />
              <span className="sr-only">Cerrar</span>
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
