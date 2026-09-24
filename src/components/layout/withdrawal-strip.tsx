import { UndoIcon } from "lucide-react";
import Link from "next/link";

/**
 * "Botón de arrepentimiento" link on the first screen of every page (Disposición SSDCyLC 954/2025:
 * visible at first access, prominent, exact label). Slim strip above any top bar and the header.
 */
export function WithdrawalStrip() {
  return (
    <div data-slot="withdrawal-strip" className="border-b border-border bg-cream text-tiny">
      <div className="page-container flex min-h-7 items-center justify-end">
        <Link
          href="/arrepentimiento/"
          className="inline-flex min-h-6 items-center gap-1.5 font-bold text-link underline-offset-2 hover:underline"
        >
          <UndoIcon aria-hidden="true" focusable="false" className="size-3.5" />
          Botón de arrepentimiento
        </Link>
      </div>
    </div>
  );
}
