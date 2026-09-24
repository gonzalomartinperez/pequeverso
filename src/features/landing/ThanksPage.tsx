import { guaranteeDays, hotmart } from "@config/commerce";
import { site } from "@config/site";
import { graciasCopy as copy } from "@content/es/gracias";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { ChipRow } from "@/components/blocks/chip-row";
import { CTAButton } from "@/components/blocks/cta-button";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { FactChip } from "@/components/blocks/fact-chip";
import { Grid } from "@/components/blocks/grid";
import { Icon } from "@/components/blocks/icon";
import { IconCardList } from "@/components/blocks/icon-card-list";
import { MediaFrame } from "@/components/blocks/media-frame";
import { MediaImage } from "@/components/blocks/media-image";
import { Notice } from "@/components/blocks/notice";
import { NumberedList } from "@/components/blocks/numbered-list";
import { ResourceGrid } from "@/components/blocks/resource-grid";
import { Section } from "@/components/blocks/section";
import { SectionHeading } from "@/components/blocks/section-heading";
import { Split } from "@/components/blocks/split";
import { Stack } from "@/components/blocks/stack";
import { Topbar } from "@/components/blocks/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Universe } from "@/motion/universe";
import type { CoreProduct } from "@/products/schema";

type Props = { product: CoreProduct };

/**
 * Post-purchase guidance. The URL is not proof of payment: no files are linked, no purchase
 * event is fired, and visitors without a purchase are pointed to the landing.
 */
export function ThanksPage({ product }: Props) {
  const firstPage = product.media.pageIds[0] ?? product.media.hero;
  const headerCta = (
    <CTAButton href={hotmart.consumerArea} variant="primary" size="sm" external icon={LogIn}>
      Abrir Hotmart
    </CTAButton>
  );

  return (
    <PageShell
      topbar={<Topbar tone="mint">{copy.topbar}</Topbar>}
      cta={headerCta}
      subtitle="Acceso a tu compra"
    >
      <Section tone="navy" labelledBy="hero-title" className="overflow-hidden">
        <Universe variant="hero" />
        <Stack gap={5} maxWidth="44rem" className="relative">
          <Eyebrow tone="dark">
            <Icon name="check" />
            {copy.hero.kicker}
          </Eyebrow>
          <h1 id="hero-title" data-hero-enter="title">
            {copy.hero.title}
          </h1>
          <p className="lead">{copy.hero.lead}</p>
          <ChipRow>
            {copy.hero.facts.map((fact) => (
              <FactChip key={fact} label={fact} tone="dark" />
            ))}
          </ChipRow>
          <CTAButton href={hotmart.consumerArea} variant="primary" external icon={LogIn} className="mt-2">
            {copy.hero.cta}
          </CTAButton>
          <p className="flex items-start gap-2 text-small">
            <Icon name="mail" size={18} className="mt-[0.15em] shrink-0 text-icon" />
            <span>{copy.hero.note}</span>
          </p>
        </Stack>
      </Section>

      <Section tone="cream" labelledBy="acceso-title">
        <SectionHeading id="acceso-title" kicker={copy.access.kicker} title={copy.access.title} />
        <IconCardList items={copy.access.steps} numbered />
        <p className="mt-8 flex justify-center">
          <CTAButton href={hotmart.consumerArea} variant="outline" external>
            {copy.access.cta}
          </CTAButton>
        </p>
      </Section>

      <Section tone="sky" labelledBy="practica-title" defer>
        <Split ratio="1.2/0.8">
          <div>
            <SectionHeading
              id="practica-title"
              kicker={copy.firstPractice.kicker}
              title={copy.firstPractice.title}
            />
            <Card pad="lg">
              <NumberedList items={copy.firstPractice.steps} />
            </Card>
          </div>
          <Stack gap={4}>
            <MediaFrame ratio="3/4" as="figure">
              <MediaImage id={firstPage} sizes="(min-width: 768px) 360px, 90vw" />
            </MediaFrame>
            <Notice tone="warning" title="Tú eliges cuánto imprimir">
              <p>{copy.firstPractice.printNote}</p>
            </Notice>
          </Stack>
        </Split>
      </Section>

      <Section tone="cream" labelledBy="recursos-title" defer>
        <SectionHeading id="recursos-title" kicker={copy.resources.kicker} title={copy.resources.title} />
        <ResourceGrid resources={product.resources} compact />
      </Section>

      <Section tone="mint" labelledBy="ayuda-title" defer>
        <SectionHeading id="ayuda-title" kicker={copy.help.kicker} title={copy.help.title} />
        <IconCardList items={copy.help.items} cols={2} />
        <p className="mt-8 max-w-[70ch]">
          {copy.help.contact} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> · Reembolsos:{" "}
          <a href={hotmart.refunds}>refund.hotmart.com</a> ({guaranteeDays} días).
        </p>
      </Section>

      <Section tone="cream" label="Notas finales" defer>
        <Grid cols={2}>
          <Notice tone="info" title={copy.packNote.title}>
            <p>{copy.packNote.text}</p>
          </Notice>
          <Notice tone="success" title={copy.noPurchase.title}>
            <p>
              {copy.noPurchase.text} <Link href={product.path}>{copy.noPurchase.cta}</Link>
            </p>
          </Notice>
        </Grid>
      </Section>
    </PageShell>
  );
}
