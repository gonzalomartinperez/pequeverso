import { hotmart } from "@config/commerce";
import { graciasCopy } from "@content/es/gracias";
import { seller } from "@content/es/legal/seller";
import { soporteCopy as copy } from "@content/es/soporte";
import { Check, Mail, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CTAButton } from "@/components/blocks/cta-button";
import { FAQ } from "@/components/blocks/faq";
import { Icon, icons } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { PageShell } from "@/components/layout/page-shell";
import { AccentText, Kicker, Sparkle } from "@/features/landing/offer/ui";
import { buildMetadata } from "@/lib/metadata";
import { Float } from "@/motion/float";

export const metadata: Metadata = buildMetadata({
  path: "/soporte/",
  title: copy.meta.title,
  description: copy.meta.description,
});

/** Transparent cut-out of a mother pointing to her right (towards the copy on wide screens). */
const HERO_CUTOUT = "gf.cutout.senala";

/** The short FAQ reuses the answers already published on the thank-you page (same facts). */
const faq = graciasCopy.help.items.map((item) => ({ q: item.title, a: item.text }));

export default function SoportePage() {
  return (
    <PageShell overlay>
      <section
        data-slot="section"
        data-tone="aurora-cream"
        aria-labelledby="soporte-title"
        className="aurora-cream relative overflow-clip pt-[calc(var(--header-height)+clamp(1.5rem,0.5rem+3vw,3.5rem))] pb-(--section-pad)"
      >
        <div className="page-container relative">
          <div className="grid items-end gap-x-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            <div className="grid gap-5 pb-8 lg:pb-16">
              <Kicker>{copy.kicker}</Kicker>
              <h1 id="soporte-title" className="text-[clamp(2.3rem,1.6rem+2.8vw,4.2rem)] leading-[1.04]">
                <AccentText text={copy.title} />
              </h1>
              <p className="lead max-w-[52ch] text-pretty">{copy.lead}</p>
              <p className="on-light glass inline-flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl py-2 pr-5 pl-2 sm:rounded-pill text-small font-bold text-navy shadow-sm">
                <span className="grid size-8 place-items-center rounded-full bg-navy text-gold">
                  <Mail aria-hidden="true" className="size-4" strokeWidth={2.4} />
                </span>
                <span>{copy.contact.label}</span>
                <a href={`mailto:${seller.supportEmail}`} className="break-all">
                  {seller.supportEmail}
                </a>
              </p>
            </div>
            <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-[22rem] lg:block">
              <div className="absolute inset-x-[6%] top-[14%] bottom-[8%] rounded-t-[999px] bg-[linear-gradient(180deg,var(--pv-celeste),var(--pv-peach))]" />
              <Sparkle className="top-[10%] left-[4%]" size={26} />
              <Sparkle className="top-[34%] right-[2%]" size={16} />
              <MediaImage
                id={HERO_CUTOUT}
                alt=""
                sizes="352px"
                priority
                className="relative block h-auto w-full"
              />
            </div>
          </div>

          <ul className="relative grid gap-4 md:grid-cols-3 lg:-mt-6">
            {copy.routes.map((route, index) => (
              <li
                key={route.title}
                data-reveal=""
                style={{ "--i": index } as CSSProperties}
                className="on-light glass grid grid-rows-[auto_auto_1fr_auto] gap-3 rounded-2xl p-6 shadow-float sm:p-7"
              >
                <span className="grid size-13 place-items-center rounded-lg bg-navy text-gold shadow-md">
                  <Icon name={route.icon} size={24} strokeWidth={2.2} />
                </span>
                <h2 className="font-display text-[1.4rem] leading-tight">{route.title}</h2>
                <p className="text-small">{route.text}</p>
                <CTAButton
                  href={route.cta.href}
                  variant="secondary"
                  size="sm"
                  external={route.cta.href.startsWith("http")}
                  icon={icons[route.icon]}
                  className="mt-2 w-full rounded-pill"
                >
                  {route.cta.label}
                </CTAButton>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        data-slot="section"
        data-tone="aurora-sky"
        aria-label="Cómo escribirnos"
        className="aurora-sky relative section-pad"
      >
        <div className="page-container grid gap-5 md:grid-cols-2">
          <div className="on-light glass grid content-start gap-4 rounded-2xl p-6 shadow-float sm:p-8">
            <h2 className="font-display text-[1.5rem] leading-tight">{copy.include.title}</h2>
            <ul className="grid gap-3">
              {copy.include.items.map((item) => (
                <li key={item} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-mint text-teal-text">
                    <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                  </span>
                  <span className="pt-1">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-small">{copy.include.note}</p>
            <p className="text-small">
              {copy.include.hotmartLabel} <a href={hotmart.consumerArea}>{copy.include.hotmartLink}</a>
            </p>
          </div>
          <div className="on-light grid content-start gap-4 rounded-2xl border border-coral/15 bg-[linear-gradient(160deg,var(--pv-white),var(--pv-peach))] p-6 shadow-float sm:p-8">
            <h2 className="font-display text-[1.5rem] leading-tight">{copy.limits.title}</h2>
            <ul className="grid gap-3">
              {copy.limits.items.map((item) => (
                <li key={item} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-white text-navy">
                    <ShieldAlert aria-hidden="true" className="size-4" strokeWidth={2.4} />
                  </span>
                  <span className="pt-1">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-small">{copy.limits.note}</p>
            <p className="text-small">
              {copy.contact.label} <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> ·{" "}
              {copy.contact.moreLabel} <Link href="/compras-y-reembolsos/">{copy.contact.moreLink}</Link>.
            </p>
          </div>
        </div>
      </section>

      <section
        data-slot="section"
        data-tone="aurora-cream"
        aria-labelledby="soporte-faq-title"
        className="aurora-cream relative section-pad"
      >
        <div className="page-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <header className="grid content-start gap-4">
            <Kicker>{graciasCopy.help.kicker}</Kicker>
            <h2 id="soporte-faq-title">{graciasCopy.help.title}</h2>
            <Float range={8} className="hidden w-40 lg:block">
              <span
                aria-hidden="true"
                className="grid aspect-square place-items-center rounded-full planet-turquoise opacity-80"
              />
            </Float>
          </header>
          <FAQ items={faq} surface="glass" />
        </div>
      </section>
    </PageShell>
  );
}
