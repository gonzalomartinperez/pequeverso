/**
 * Shared shapes for the per-product content folders (`content/es/products/<slug>/`).
 * Each folder holds `copy.ts` (landing copy), `resources.ts` (the real PDFs) and `faq.ts`;
 * the product module in `src/products/<slug>.ts` assembles them with the business facts.
 */
import type { IconName } from "@/components/ui/Icon/Icon";

export type Resource = {
  id: string;
  /** media manifest id of the card image */
  card: string;
  title: string;
  pages: number | null;
  pagesLabel: string;
  description: string;
  /** True for bonuses embedded inside another PDF of the same product. */
  embedded?: boolean;
};

export type FaqItem = { q: string; a: string };

type Anchor = { href: string; label: string };
type IconFact = { icon: IconName; label: string; detail: string };
type IconStep = { icon: IconName; title: string; text: string };
type IconPoint = { icon: IconName; text: string };
type Section = { kicker: string; title: string; lead?: string };

/** Copy of a principal landing (checkout CTA). */
export type CoreLandingCopy = {
  topbar: readonly string[];
  nav: readonly Anchor[];
  subtitle: string;
  hero: {
    kicker: string;
    title: string;
    lead: string;
    facts: readonly IconFact[];
    cta: string;
    ctaNote: string;
    priceKicker: string;
    taxNote: string;
    currencyNote: string;
  };
  trust: readonly IconPoint[];
  problem: Section & { paragraphs: readonly string[]; bullets: readonly string[] };
  method: Section & { steps: readonly IconStep[] };
  pages: Section & { zoomHint: string; galleryLabel: string };
  included: Section & { total: string };
  midOffer: { title: string; text: string; cta: string };
  videos: Section;
  credibility: { kicker: string; title: string; text: string; points: readonly string[] };
  benefits: Section & { items: readonly IconStep[]; callout: string };
  faq: Section & { items: readonly FaqItem[]; supportNote: string };
  finalOffer: { kicker: string; title: string; checks: readonly string[]; cta: string; note: string };
  sticky: { label: string; cta: string };
};

type OfferView = { kicker: string; title: string; lead: string; priceKicker: string; decisionHint: string };

/** Copy of a post-purchase offer page (upsell and downsell views, Hotmart widget decision). */
export type OfferLandingCopy = {
  topbar: string;
  header: { subtitle: string; cta: string };
  facts: readonly { label: string; detail: string }[];
  taxNote: string;
  upsell: OfferView;
  downsell: OfferView & {
    previousLabel: string;
    proof: string;
    objections: readonly { title: string; text: string }[];
  };
  complement: {
    kicker: string;
    title: string;
    ownedLabel: string;
    offerLabel: string;
    owned: { title: string; points: readonly string[] };
    offer: { title: string; points: readonly string[] };
  };
  included: Section & { total: string };
  pages: Section & { galleryLabel: string };
  moments: Section & { items: readonly IconStep[] };
  faq: Section & { items: readonly FaqItem[] };
  close: { kicker: string; title: string; text: string; cta: string };
  decision: {
    upsell: { kicker: string; title: string; text: string };
    downsell: { kicker: string; title: string; text: string };
  };
  widget: { loading: string; fallbackTitle: string; fallbackText: string; reload: string };
  sticky: { upsell: string; downsell: string };
};
