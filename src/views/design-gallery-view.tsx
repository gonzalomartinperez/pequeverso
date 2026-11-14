import { hotmart } from "@config/commerce.ts";
import type { ReactNode } from "react";
import { HotmartWidgetSlot } from "@/features/commerce/presentation/hotmart-widget-slot.tsx";
import { StickyCTA } from "@/features/commerce/presentation/sticky-cta.tsx";
import { CookieSettingsLink } from "@/features/tracking/presentation/cookie-settings-link.tsx";
import { CTAButton } from "@/shared/editorial/cta-button.tsx";
import { Notice } from "@/shared/editorial/notice.tsx";
import { Section } from "@/shared/editorial/section.tsx";
import { badgeVariants } from "@/shared/ui/badge-variants.ts";
import { Skeleton } from "@/shared/ui/skeleton.tsx";
import { WithdrawalStrip } from "@/shell/withdrawal-strip.tsx";

const VARIANTS = ["primary", "secondary", "outline", "inverse", "ghost", "link"] as const;
const SIZES = ["sm", "default", "lg", "xl", "icon"] as const;
const BADGES = [
  "chip",
  "turquoise",
  "coral",
  "gold-soft",
  "sky",
  "gold",
  "navy",
  "outline",
] as const;
const TONES = ["info", "success", "warning"] as const;

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} data-gallery-block={id} className="grid gap-4">
      <h2 id={`${id}-title`} className="text-h3">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Every button treatment as a link, as a button and disabled, with and without the trailing icon. */
function Buttons({ variants }: { variants: readonly (typeof VARIANTS)[number][] }) {
  return (
    <div className="grid gap-4">
      {variants.map((variant) => (
        <div
          key={variant}
          data-gallery-row={`button-${variant}`}
          className="flex flex-wrap items-center gap-3"
        >
          <code className="w-24 text-small">{variant}</code>
          <CTAButton variant={variant} href="/">
            Link
          </CTAButton>
          <CTAButton variant={variant} iconAfter="arrow">
            Button
          </CTAButton>
          <CTAButton variant={variant} disabled>
            Disabled
          </CTAButton>
        </div>
      ))}
    </div>
  );
}

export function DesignGalleryView() {
  return (
    <main id="contenido" data-design-gallery="pv-design-gallery">
      <Section tone="cream">
        <div className="grid gap-12">
          <header className="grid gap-2">
            <h1 className="text-h2">Design state gallery</h1>
            <p>
              Unpublishable verification build (NEXT_PUBLIC_DESIGN_GALLERY). Hover and focus are
              exercised by tests on the controls below.
            </p>
          </header>

          <Block id="buttons" title="Buttons: treatment x state">
            <Buttons variants={VARIANTS.filter((variant) => variant !== "inverse")} />
            <div data-gallery-row="button-sizes" className="flex flex-wrap items-center gap-3">
              {SIZES.map((size) => (
                <CTAButton key={size} size={size} variant="primary" aria-label={`Size ${size}`}>
                  {size}
                </CTAButton>
              ))}
            </div>
          </Block>

          <Block id="badges" title="Badges">
            <div className="flex flex-wrap gap-3">
              {BADGES.map((variant) => (
                <span key={variant} className={badgeVariants({ variant, dot: true })}>
                  {variant}
                </span>
              ))}
            </div>
          </Block>

          <Block id="notices" title="Notices">
            <div className="grid gap-4 md:grid-cols-3">
              {TONES.map((tone) => (
                <Notice key={tone} tone={tone} title={tone}>
                  <p>Notice body text for the {tone} tone.</p>
                </Notice>
              ))}
              <Notice tone="warning" role="alert" title="alert">
                <p>The same panel announced as an alert.</p>
              </Notice>
            </div>
          </Block>

          <Block id="skeleton" title="Skeleton">
            <Skeleton className="h-16 w-full max-w-md" />
          </Block>

          <Block id="banners" title="Banners">
            <p>
              The consent banner is mounted by the root layout and opens on request (it reads the
              pixel and analytics configuration of this build).
            </p>
            <div>
              <CookieSettingsLink />
            </div>
            <div className="grid gap-4">
              <WithdrawalStrip tone="navy" />
              <WithdrawalStrip tone="light" />
            </div>
          </Block>

          <Block id="sticky" title="Sticky purchase bar (viewports below lg)">
            <p>
              Fixed to the bottom of the viewport. Its sentinel is never visible, so the bar is
              shown.
            </p>
            <div
              id="gallery-sticky-sentinel"
              aria-hidden="true"
              className="absolute -top-[200vh] h-px w-px"
            />
            <StickyCTA
              hideWhenVisible={["#gallery-sticky-sentinel"]}
              label="Kit completo · US$14,99"
              note="Se cobra en tu moneda local."
            >
              <CTAButton variant="primary" size="sm">
                Comprar
              </CTAButton>
            </StickyCTA>
          </Block>

          <Block id="widget" title="Hotmart widget slot (loading, then fallback after the timeout)">
            <HotmartWidgetSlot
              heading={<h2 id="gfp-decision-title">Widget heading</h2>}
              loadingText="Cargando tu oferta..."
              fallbackTitle="No pudimos cargar la oferta"
              fallbackText="Recarga la página para intentarlo de nuevo."
              reloadLabel="Recargar"
              timeoutMs={4000}
            />
            <p className="text-small">Container id: {hotmart.salesFunnelContainerId}.</p>
          </Block>
        </div>
      </Section>

      <Section tone="navy">
        <div className="grid gap-4">
          <h2 className="text-h3">Buttons on navy</h2>
          <Buttons variants={VARIANTS} />
        </div>
      </Section>
    </main>
  );
}
