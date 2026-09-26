"use client";

import { errorCopy as copy } from "@content/es/soporte";
import Link from "next/link";
import { useEffect } from "react";
import { badgeVariants } from "@/components/ui/badge-variants";
import { buttonVariants } from "@/components/ui/button-variants";

type Props = { error: Error & { digest?: string }; reset: () => void };

/**
 * Route error boundary (client) on every route: a glass card on an aurora ground. Plain elements
 * with variant classes keep it free of client primitives (and of the media manifest).
 */
export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="contenido"
      className="aurora-cream relative isolate grid min-h-dvh place-items-center overflow-clip px-(--gutter) py-16"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1">
        <div className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-[radial-gradient(closest-side,var(--pv-celeste),transparent)]" />
        <div className="planet-gold absolute top-[18%] left-[12%] size-5 rounded-full" />
        <div className="absolute top-[calc(18%-1.75rem)] left-[calc(12%-1.75rem)] size-19 rounded-full border border-dashed border-navy/18" />
      </div>
      <div className="glass grid w-full max-w-[40rem] justify-items-start gap-5 rounded-2xl p-[clamp(1.5rem,5vw,3rem)] shadow-float ring-1 ring-navy/8">
        <Link href="/" className="font-display text-2xl leading-none font-bold text-navy no-underline">
          pequeverso
        </Link>
        <p className={`${badgeVariants({ variant: "chip" })} rounded-pill!`}>{copy.kicker}</p>
        <h1 className="text-balance">{copy.title}</h1>
        <p className="lead text-pretty">{copy.lead}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            className={`${buttonVariants({ variant: "secondary" })} rounded-pill!`}
            onClick={() => reset()}
          >
            {copy.retry}
          </button>
          <Link href="/" className={`${buttonVariants({ variant: "outline" })} rounded-pill!`}>
            {copy.home}
          </Link>
          <Link href="/soporte/" className={`${buttonVariants({ variant: "ghost" })} rounded-pill!`}>
            {copy.support}
          </Link>
        </div>
      </div>
    </main>
  );
}
