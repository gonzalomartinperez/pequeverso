"use client";

import { errorCopy as copy } from "@content/es/soporte";
import Link from "next/link";
import { useEffect } from "react";
import { badgeVariants } from "@/components/ui/badge-variants";
import { buttonVariants } from "@/components/ui/button-variants";

type Props = { error: Error & { digest?: string }; reset: () => void };

/** Route error boundary (client) on every route: plain elements with variant classes keep it free of client primitives. */
export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="contenido" className="page-container section-pad">
      <div className="grid max-w-[60ch] justify-items-start gap-4">
        <p className={badgeVariants({ variant: "chip" })}>{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={buttonVariants({ variant: "primary" })} onClick={() => reset()}>
            {copy.retry}
          </button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            {copy.home}
          </Link>
          <Link href="/soporte/" className={buttonVariants({ variant: "outline" })}>
            {copy.support}
          </Link>
        </div>
      </div>
    </main>
  );
}
