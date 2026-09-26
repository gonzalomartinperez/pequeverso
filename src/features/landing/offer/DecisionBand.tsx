import { guaranteeDays } from "@config/commerce";
import { RefreshCcw, ShieldCheck } from "lucide-react";
import { MediaImage } from "@/components/blocks/media-image";
import { HotmartWidgetSlot } from "@/features/commerce/HotmartWidgetSlot/HotmartWidgetSlot";
import { Float } from "@/motion/float";
import type { OfferProduct } from "@/products/schema";
import { Kicker, Sparkle, StarField } from "./ui";

type Props = { product: OfferProduct };

/** The topbar's reassurance phrases ("purchase confirmed", "optional"), repeated beside the decision. */
function reassurance(topbar: string): string[] {
  return topbar.split(" · ");
}

/**
 * Navy decision band: the single Hotmart widget inside a light premium card (the slot itself is
 * `#gfp-decision`), with the pack cover and the reassurance beside it. Both views' headings are in
 * the slot and toggled by CSS; the widget container stays outside both views.
 */
export function DecisionBand({ product }: Props) {
  const { copy, media } = product;
  const cover = media.cards[0];
  const notes = [
    ...reassurance(copy.topbar).map((label) => ({ icon: ShieldCheck, label })),
    { icon: RefreshCcw, label: `${guaranteeDays} días de garantía en Hotmart` },
  ];
  return (
    <section
      data-slot="section"
      data-tone="navy"
      aria-label="Decisión de la oferta"
      className="on-navy sky-nebula relative overflow-clip section-pad"
    >
      <StarField />
      <div
        aria-hidden="true"
        className="planet-teal pointer-events-none absolute -bottom-40 -left-32 size-[clamp(220px,28vw,420px)] rounded-full opacity-40"
      />
      <div className="page-container relative grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="relative order-2 grid justify-items-center gap-8 lg:order-1 lg:justify-items-start">
          {cover ? (
            <div className="relative hidden w-full max-w-[22rem] md:block" aria-hidden="true">
              <div className="absolute inset-[12%] rounded-full bg-turquoise/25 blur-3xl" />
              <Float rotate={-5} range={10}>
                <span className="block overflow-hidden rounded-xl border-4 border-white/90 shadow-[0_40px_80px_-24px_oklch(0.08_0.05_256/0.8)] [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:object-cover">
                  <MediaImage id={cover} alt="" sizes="(min-width: 1024px) 352px, 60vw" />
                </span>
              </Float>
              <Sparkle className="-top-3 right-6" size={32} />
              <Sparkle className="bottom-8 -left-3" size={18} />
            </div>
          ) : null}
          <ul className="grid w-full max-w-[26rem] gap-3">
            {notes.map(({ icon: NoteIcon, label }) => (
              <li
                key={label}
                className="glass-dark flex min-h-12 items-center gap-3 rounded-lg px-4 py-3 font-bold text-white"
              >
                <NoteIcon aria-hidden="true" className="size-5 shrink-0 text-gold" strokeWidth={2.2} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 grid lg:order-2" data-motion="none">
          <HotmartWidgetSlot
            heading={
              <>
                <div className="only-upsell grid gap-3">
                  <Kicker as="span">{copy.decision.upsell.kicker}</Kicker>
                  <h2 id="gfp-decision-title">{copy.decision.upsell.title}</h2>
                  <p>{copy.decision.upsell.text}</p>
                </div>
                <div className="only-downsell grid gap-3">
                  <Kicker as="span" tone="warm">
                    {copy.decision.downsell.kicker}
                  </Kicker>
                  <h2 id="gfp-decision-title-downsell">{copy.decision.downsell.title}</h2>
                  <p>{copy.decision.downsell.text}</p>
                </div>
              </>
            }
            loadingText={copy.widget.loading}
            fallbackTitle={copy.widget.fallbackTitle}
            fallbackText={copy.widget.fallbackText}
            reloadLabel={copy.widget.reload}
          />
        </div>
      </div>
    </section>
  );
}
