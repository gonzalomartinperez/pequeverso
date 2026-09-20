import { hotmart } from "@config/commerce";
import { seller } from "@content/es/legal/seller";
import { soporteCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { BulletList } from "@/components/ui/BulletList/BulletList";
import { Card } from "@/components/ui/Card/Card";
import { CTAButton } from "@/components/ui/CTAButton/CTAButton";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { Grid } from "@/components/ui/Grid/Grid";
import { icons } from "@/components/ui/Icon/Icon";
import { IconBadge } from "@/components/ui/IconBadge/IconBadge";
import { Section } from "@/components/ui/Section/Section";
import { Stack } from "@/components/ui/Stack/Stack";
import { buildMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  path: "/soporte/",
  title: copy.meta.title,
  description: copy.meta.description,
});

export default function SoportePage() {
  return (
    <PageShell>
      <Section tone="cream" labelledBy="soporte-title">
        <Stack gap={3} maxWidth="62ch" as="header" className={styles.header}>
          <Eyebrow>{copy.kicker}</Eyebrow>
          <h1 id="soporte-title">{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
        </Stack>
        <Grid cols={3} as="ul">
          {copy.routes.map((route, index) => (
            <Card key={route.title} as="li" pad="lg" reveal stagger={index}>
              <IconBadge icon={route.icon} />
              <h2 className={styles.title}>{route.title}</h2>
              <p>{route.text}</p>
              <CTAButton
                href={route.cta.href}
                variant="secondary"
                size="small"
                external
                icon={icons[route.icon]}
              >
                {route.cta.label}
              </CTAButton>
            </Card>
          ))}
        </Grid>
        <Card variant="soft" className={styles.notes}>
          <h2 className={styles.title}>{copy.include.title}</h2>
          <BulletList items={copy.include.items} icon="mail" />
          <p>{copy.include.note}</p>
          <p>
            {copy.include.hotmartLabel} <a href={hotmart.consumerArea}>{copy.include.hotmartLink}</a>
          </p>
        </Card>
        <Card variant="soft" className={styles.notes}>
          <h2 className={styles.title}>{copy.limits.title}</h2>
          <BulletList items={copy.limits.items} icon="shield" />
          <p>{copy.limits.note}</p>
          <p>
            {copy.contact.label} <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> ·{" "}
            {copy.contact.moreLabel} <Link href="/compras-y-reembolsos/">{copy.contact.moreLink}</Link>.
          </p>
        </Card>
      </Section>
    </PageShell>
  );
}
