import { guaranteeDays, hotmart } from "@config/commerce";
import { site } from "@config/site";
import { graciasCopy as copy } from "@content/es/gracias";
import { ArrowRight, CircleCheck, FolderOpen, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CTAButton } from "@/components/blocks/cta-button";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { ResourceGrid } from "@/components/blocks/resource-grid";
import { Topbar } from "@/components/blocks/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Float } from "@/motion/float";
import type { CoreProduct } from "@/products/schema";
import { AccentText, Kicker, Sparkle } from "./offer/ui";

type Props = { product: CoreProduct };

/** Lifestyle photo of the "print at home" moment (illustrative). */
const PRINT_PHOTO = "gf.life.imprimir-kit";
/** Transparent cut-out of the tablet with printed sheets (the "download, then print" idea). */
const HERO_CUTOUT = "gf.cutout.tablet";

function SectionHeading({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <header className="mx-auto mb-10 grid max-w-[44rem] justify-items-center gap-4 text-center md:mb-14">
      <Kicker>{kicker}</Kicker>
      <h2 id={id}>
        <AccentText text={title} />
      </h2>
    </header>
  );
}

/**
 * Post-purchase guidance: a warm, light page of next steps. The URL is not proof of payment: no
 * files are linked, no purchase event is fired, nothing claims the payment went through beyond
 * Hotmart's own confirmation, and visitors without a purchase are pointed to the landing.
 */
export function ThanksPage({ product }: Props) {
  const firstPage = product.media.pageIds[0] ?? product.media.hero;
  const headerCta = (
    <CTAButton href={hotmart.consumerArea} variant="secondary" size="sm" external icon={LogIn}>
      Abrir Hotmart
    </CTAButton>
  );

  return (
    <PageShell
      topbar={<Topbar tone="mint">{copy.topbar}</Topbar>}
      cta={headerCta}
      subtitle="Acceso a tu compra"
      overlay
    >
      {/* Hero */}
      <section
        data-slot="section"
        data-tone="aurora-sky"
        aria-labelledby="hero-title"
        className="aurora-sky relative overflow-clip pt-[calc(var(--header-height)+clamp(2rem,1rem+3vw,4rem))] pb-(--section-pad)"
      >
        <div className="page-container relative grid items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="grid gap-5">
            <p className="inline-flex w-fit max-w-full items-center gap-2 rounded-pill border border-teal/25 bg-white/80 py-1.5 pr-4 pl-1.5 text-small font-extrabold text-navy shadow-sm">
              <CircleCheck
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full bg-teal p-1 text-white"
                strokeWidth={2.6}
              />
              <span>{copy.hero.kicker}</span>
            </p>
            <h1
              id="hero-title"
              data-hero-enter="title"
              className="text-[clamp(2.2rem,1.6rem+2.4vw,3.9rem)] leading-[1.05] text-balance"
            >
              <AccentText text={copy.hero.title} />
            </h1>
            <p className="lead max-w-[54ch] text-pretty">{copy.hero.lead}</p>
            <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <CTAButton
                href={hotmart.consumerArea}
                variant="secondary"
                size="lg"
                external
                icon={LogIn}
                className="rounded-pill shadow-float"
              >
                {copy.hero.cta}
              </CTAButton>
            </div>
            <p className="flex max-w-[54ch] items-start gap-2 text-small text-body">
              <Mail
                aria-hidden="true"
                className="mt-[0.15em] size-[18px] shrink-0 text-teal-text"
                strokeWidth={2.2}
              />
              <span>{copy.hero.note}</span>
            </p>
            <ul className="mt-1 flex flex-wrap gap-2" aria-label="Tu compra incluye">
              {copy.hero.facts.map((fact) => (
                <li
                  key={fact}
                  className="on-light glass inline-flex min-h-10 items-center gap-2 rounded-pill px-4 py-1.5 text-small font-bold text-navy"
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-teal" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
          <div aria-hidden="true" className="relative mx-auto w-full max-w-[36rem]">
            <div className="absolute inset-[6%_10%] -z-0 rounded-full bg-[radial-gradient(circle,oklch(0.96_0.04_187),oklch(0.9_0.05_230/0.6)_50%,transparent_72%)]" />
            <Sparkle className="top-[4%] left-[14%]" size={28} />
            <Sparkle className="right-[8%] bottom-[18%]" size={18} />
            <Float range={10} className="relative">
              <MediaImage
                id={HERO_CUTOUT}
                alt=""
                sizes="(min-width: 1024px) 560px, 92vw"
                priority
                className="h-auto w-full drop-shadow-[0_30px_40px_oklch(0.3175_0.1094_256.25/0.22)]"
              />
            </Float>
            <p className="on-light glass absolute bottom-[4%] left-[2%] flex items-center gap-3 rounded-lg px-4 py-3 shadow-float">
              <span className="grid size-10 place-items-center rounded-md bg-navy text-gold">
                <FolderOpen className="size-5" strokeWidth={2.2} />
              </span>
              <span className="grid leading-tight">
                <strong className="text-small text-navy">{copy.hero.visualLabel}</strong>
                <span className="text-tiny font-bold text-subtle">{copy.hero.visualHint}</span>
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Next steps timeline */}
      <section
        data-slot="section"
        data-tone="aurora-cream"
        aria-labelledby="acceso-title"
        className="aurora-cream relative section-pad"
      >
        <div className="page-container">
          <SectionHeading id="acceso-title" kicker={copy.access.kicker} title={copy.access.title} />
          <ol className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5 lg:before:absolute lg:before:top-8 lg:before:right-[12%] lg:before:left-[12%] lg:before:h-0.5 lg:before:bg-[linear-gradient(90deg,var(--pv-turquoise),var(--pv-gold),var(--pv-turquoise))] lg:before:content-['']">
            {copy.access.steps.map((step, index) => (
              <li
                key={step.title}
                data-reveal=""
                style={{ "--i": index } as CSSProperties}
                className="relative grid content-start justify-items-start gap-3 lg:justify-items-center lg:text-center"
              >
                <span className="relative z-1 grid size-16 place-items-center rounded-full bg-navy text-gold shadow-float ring-6 ring-white">
                  <Icon name={step.icon} size={26} strokeWidth={2.2} />
                  <span className="absolute -top-1 -right-1 grid size-7 place-items-center rounded-full bg-gold text-tiny font-extrabold text-ink">
                    {index + 1}
                  </span>
                </span>
                <div className="on-light glass grid w-full gap-2 rounded-xl p-5 shadow-[0_18px_40px_-24px_oklch(0.3175_0.1094_256.25/0.4)]">
                  <h3 className="font-display text-[1.3rem] leading-tight font-bold">{step.title}</h3>
                  <p className="text-small">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 flex justify-center">
            <CTAButton href={hotmart.consumerArea} variant="outline" external className="rounded-pill">
              {copy.access.cta}
            </CTAButton>
          </p>
        </div>
      </section>

      {/* First practice */}
      <section
        data-slot="section"
        data-tone="aurora-blue"
        aria-labelledby="practica-title"
        className="aurora-blue defer-render relative section-pad"
      >
        <div className="page-container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <figure className="relative mx-auto w-full max-w-[36rem] pb-10 lg:order-2">
            <div className="overflow-hidden rounded-2xl border-[6px] border-white shadow-float [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:object-cover">
              <MediaImage id={PRINT_PHOTO} sizes="(min-width: 1024px) 560px, 92vw" />
            </div>
            <Float rotate={-6} range={8} className="absolute -bottom-2 -left-2 w-[34%] sm:-left-8">
              <span className="block overflow-hidden rounded-lg border-4 border-white bg-white shadow-float [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:object-cover">
                <MediaImage id={firstPage} sizes="(min-width: 1024px) 200px, 34vw" />
              </span>
            </Float>
            <figcaption className="absolute right-3 bottom-2 text-tiny font-bold text-subtle">
              {copy.firstPractice.imageNote}
            </figcaption>
          </figure>
          <div className="grid content-start gap-6 lg:order-1">
            <div className="grid gap-4">
              <Kicker>{copy.firstPractice.kicker}</Kicker>
              <h2 id="practica-title">
                <AccentText text={copy.firstPractice.title} />
              </h2>
            </div>
            <ol className="on-light glass grid gap-4 rounded-2xl p-6 shadow-float sm:p-8">
              {copy.firstPractice.steps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-mint font-display font-bold text-navy">
                    {index + 1}
                  </span>
                  <span className="pt-1.5 text-body">{step}</span>
                </li>
              ))}
            </ol>
            <p className="flex items-start gap-3 rounded-xl border border-gold/40 bg-lemon/70 p-4 text-small text-ink">
              <Icon name="printer" size={20} className="mt-0.5 shrink-0 text-navy" />
              <span>{copy.firstPractice.printNote}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section
        data-slot="section"
        data-tone="aurora-sky"
        aria-labelledby="recursos-title"
        className="aurora-sky defer-render relative section-pad"
      >
        <div className="page-container">
          <SectionHeading id="recursos-title" kicker={copy.resources.kicker} title={copy.resources.title} />
          <ResourceGrid resources={product.resources} compact />
        </div>
      </section>

      {/* Help */}
      <section
        data-slot="section"
        data-tone="aurora-cream"
        aria-labelledby="ayuda-title"
        className="aurora-cream defer-render relative section-pad"
      >
        <div className="page-container">
          <SectionHeading id="ayuda-title" kicker={copy.help.kicker} title={copy.help.title} />
          <ul className="grid gap-4 md:grid-cols-2">
            {copy.help.items.map((item, index) => (
              <li
                key={item.title}
                data-reveal=""
                style={{ "--i": index % 2 } as CSSProperties}
                className="on-light glass grid grid-cols-[3rem_minmax(0,1fr)] gap-4 rounded-xl p-5 shadow-[0_18px_40px_-24px_oklch(0.3175_0.1094_256.25/0.4)] sm:p-6"
              >
                <span className="grid size-12 place-items-center rounded-lg bg-mint text-navy">
                  <Icon name={item.icon} size={22} strokeWidth={2.2} />
                </span>
                <div className="grid gap-1">
                  <h3 className="text-[1.1rem] font-extrabold">{item.title}</h3>
                  <p className="text-small">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-10 grid max-w-[60rem] gap-4 rounded-2xl bg-navy p-6 text-center sm:p-8 on-navy">
            <p className="text-on-navy">
              {copy.help.contact} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> ·
              Reembolsos: <a href={hotmart.refunds}>refund.hotmart.com</a> ({guaranteeDays} días).
            </p>
            <p>
              <Link
                href="/soporte/"
                className="inline-flex min-h-11 items-center gap-2 font-extrabold text-gold hover:text-white"
              >
                {copy.help.supportLink}
                <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.6} />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Final notes */}
      <section
        data-slot="section"
        data-tone="aurora-sky"
        aria-label="Notas finales"
        className="aurora-sky defer-render relative section-pad"
      >
        <div className="page-container grid gap-4 md:grid-cols-2">
          <div className="on-light glass grid content-start gap-2 rounded-xl p-6 shadow-sm">
            <h2 className="text-[1.3rem] leading-tight">{copy.packNote.title}</h2>
            <p>{copy.packNote.text}</p>
          </div>
          <div className="on-light glass grid content-start gap-2 rounded-xl p-6 shadow-sm">
            <h2 className="text-[1.3rem] leading-tight">{copy.noPurchase.title}</h2>
            <p>
              {copy.noPurchase.text} <Link href={product.path}>{copy.noPurchase.cta}</Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
