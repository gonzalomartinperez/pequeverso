import type { ReactNode } from "react";
import { Universe } from "@/motion/universe";
import { Arc } from "./parts";

type Props = {
  id: string;
  titleId: string;
  breadcrumb: { home: string; label: string };
  /** The product gallery (client island with server-rendered slides). */
  gallery: ReactNode;
  /** The buy box (name, price, variant, CTA, details). */
  buyBox: ReactNode;
};

/**
 * Product-page hero. A navy "pequeño universo" band (live 3D scene, pause control) paints behind
 * the floating header and the top of the page and closes on a paper arc; the gallery card and the
 * buy box float over that boundary. From lg the gallery sticks while the buy box scrolls.
 */
export function ProductHero({ id, titleId, breadcrumb, gallery, buyBox }: Props) {
  return (
    <section
      id={id}
      data-slot="product-hero"
      aria-labelledby={titleId}
      className="cq relative isolate overflow-x-clip bg-cream [&:has([data-slot=scene-stage][data-mode=paused])_.pv-float]:[animation-play-state:paused]"
    >
      <div className="absolute inset-x-0 top-0 h-[calc(var(--header-height)+clamp(15rem,34cqw,27rem))] [&_[data-slot=scene-toggle]]:top-[calc(var(--header-height)+0.5rem)] [&>[data-slot=universe]]:sky-nebula">
        <Universe variant="hero" />
        <Arc fill="var(--pv-cream)" className="absolute inset-x-0 -bottom-px" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(45%_55%_at_100%_70%,oklch(0.9483_0.0301_55.6/80%),transparent_70%),radial-gradient(40%_50%_at_0%_90%,oklch(0.9425_0.0305_244.5/80%),transparent_70%)]"
      />

      <div className="page-container relative pt-[calc(var(--header-height)+0.75rem)] pb-[clamp(2.5rem,6cqw,4.5rem)]">
        <nav aria-label="Ruta de navegación" className="on-navy mb-4 pr-14 text-small font-bold">
          <ol className="flex flex-wrap items-center gap-2 text-white/75" role="list">
            <li>
              <a
                href="/"
                className="inline-flex min-h-11 items-center text-white/80 no-underline hover:text-gold"
              >
                {breadcrumb.home}
              </a>
            </li>
            <li aria-hidden="true" className="text-white/40">
              /
            </li>
            <li>
              <span aria-current="page" className="text-white">
                {breadcrumb.label}
              </span>
            </li>
          </ol>
        </nav>
        <div className="grid items-start gap-6 cq-lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] cq-lg:gap-10 cq-xl:gap-14">
          <div className="min-w-0 cq-lg:sticky cq-lg:top-[calc(var(--header-height)+1rem)]">{gallery}</div>
          <div className="min-w-0">{buyBox}</div>
        </div>
      </div>
    </section>
  );
}
