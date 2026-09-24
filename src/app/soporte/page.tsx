import { hotmart } from "@config/commerce";
import { seller } from "@content/es/legal/seller";
import { soporteCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";
import Link from "next/link";
import { BulletList } from "@/components/blocks/bullet-list";
import { CTAButton } from "@/components/blocks/cta-button";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Grid } from "@/components/blocks/grid";
import { icons } from "@/components/blocks/icon";
import { IconBadge } from "@/components/blocks/icon-badge";
import { Section } from "@/components/blocks/section";
import { Stack } from "@/components/blocks/stack";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/soporte/",
  title: copy.meta.title,
  description: copy.meta.description,
});

export default function SoportePage() {
  return (
    <PageShell>
      <Section tone="cream" labelledBy="soporte-title">
        <Stack gap={3} maxWidth="62ch" as="header" className="mb-8">
          <Eyebrow>{copy.kicker}</Eyebrow>
          <h1 id="soporte-title">{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
        </Stack>
        <Grid cols={3} as="ul">
          {copy.routes.map((route, index) => (
            <Card key={route.title} as="li" pad="lg" reveal stagger={index}>
              <IconBadge icon={route.icon} />
              <CardTitle as="h2">{route.title}</CardTitle>
              <p>{route.text}</p>
              <CTAButton href={route.cta.href} variant="outline" size="sm" external icon={icons[route.icon]}>
                {route.cta.label}
              </CTAButton>
            </Card>
          ))}
        </Grid>
        <Grid cols={2} className="mt-12">
          <Card variant="soft" pad="lg">
            <CardTitle as="h2">{copy.include.title}</CardTitle>
            <BulletList items={copy.include.items} icon="mail" />
            <p>{copy.include.note}</p>
            <p>
              {copy.include.hotmartLabel} <a href={hotmart.consumerArea}>{copy.include.hotmartLink}</a>
            </p>
          </Card>
          <Card variant="soft" pad="lg">
            <CardTitle as="h2">{copy.limits.title}</CardTitle>
            <BulletList items={copy.limits.items} icon="shield" />
            <p>{copy.limits.note}</p>
            <p>
              {copy.contact.label} <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> ·{" "}
              {copy.contact.moreLabel} <Link href="/compras-y-reembolsos/">{copy.contact.moreLink}</Link>.
            </p>
          </Card>
        </Grid>
      </Section>
    </PageShell>
  );
}
