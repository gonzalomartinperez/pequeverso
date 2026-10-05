"use client";
import { CloudOff, LifeBuoy, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Availability } from "../domain/models";
import { usePresentation } from "./context";
import { Callout } from "./parts";

export function Connecting() {
  const { t } = usePresentation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p role="status" className="flex items-center gap-2 text-small text-subtle">
        <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        {t.connecting}
      </p>
    </div>
  );
}

function SupportLink() {
  const { t, supportPath, onNavigate } = usePresentation();
  return (
    <Link
      href={supportPath}
      onClick={onNavigate}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <LifeBuoy aria-hidden="true" className="size-4" />
      {t.supportLink}
    </Link>
  );
}

/** The session could not be opened (network or dependency failure): the store keeps working. */
export function Offline({ onReconnect }: { onReconnect: () => void }) {
  const { t } = usePresentation();
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 p-5">
      <Callout tone="info" role="alert">
        <CloudOff aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="font-bold text-heading">{t.offlineTitle}</p>
          <p>{t.offlineBody}</p>
        </div>
      </Callout>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
          onClick={onReconnect}
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          {t.reconnect}
        </button>
        <SupportLink />
      </div>
    </div>
  );
}

/** The API refuses new questions (disabled, budget or catalog). History stays readable. */
export function Unavailable({
  availability,
}: {
  availability: Extract<Availability, { status: "unavailable" }>;
}) {
  const { t } = usePresentation();
  return (
    <div className="flex flex-col gap-3">
      <Callout tone="info" role="status">
        <LifeBuoy aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="font-bold text-heading">{t.unavailableTitle}</p>
          <p>{t.unavailableBody[availability.reason]}</p>
        </div>
      </Callout>
      <div>
        <SupportLink />
      </div>
    </div>
  );
}
