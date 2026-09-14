/**
 * Product registry schema (Zod v4). Parsed once at build time by `src/products/index.ts`;
 * never imported from client components. Business facts that used to live in
 * `config/commerce.ts` are declared per product in `src/products/<slug>.ts`.
 */
import { z } from "zod";
import type { CoreLandingCopy, OfferLandingCopy } from "../../content/es/products/index.ts";
import { hasMedia } from "../lib/media.ts";

const SLUG = /^[a-z0-9-]+$/;
const CODE = /^[a-z0-9]+$/;
const ENV_KEY = /^NEXT_PUBLIC_[A-Z0-9_]+$/;
const THANKS_PATH = /^\/[a-z0-9-]+\/gracias\/$/;

/** A media manifest id that exists in `media/manifest.json` (any kind). */
export const MediaId = z.string().refine(hasMedia, {
  error: (issue) => `unknown media id "${String(issue.input)}" (declare it in tools/media/sources.json)`,
});

const Price = z.number().positive().multipleOf(0.01);

const Composition = z.object({
  pdfCount: z.int().positive(),
  pageCount: z.int().positive(),
  ageRange: z.string().min(1),
  visibleResources: z.int().positive().optional(),
});

const Media = z.object({
  hero: MediaId,
  og: MediaId.optional(),
  pageIds: z.array(MediaId).min(1),
  videoIds: z.array(MediaId),
  cards: z.array(MediaId).min(1),
});

const Seo = z.object({
  index: z.boolean(),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.number().min(0).max(1),
});

const Resource = z.object({
  id: z.string().regex(SLUG),
  card: MediaId,
  title: z.string().min(1),
  pages: z.int().positive().nullable(),
  pagesLabel: z.string().min(1),
  description: z.string().min(1),
  embedded: z.boolean().optional(),
});

const Base = z.object({
  slug: z.string().regex(SLUG),
  code: z.string().regex(CODE),
  name: z.string().min(1),
  shortName: z.string().min(1),
  checkoutTitle: z.string().min(1).optional(),
  composition: Composition,
  media: Media,
  seo: Seo,
  resources: z.array(Resource).min(1),
});

const isObject = (value: unknown): boolean => typeof value === "object" && value !== null;

const Core = Base.extend({
  kind: z.literal("core"),
  media: Media.extend({ scenes: z.object({ problem: MediaId, credibility: MediaId }) }),
  pricing: z.object({ list: Price }),
  checkout: z.object({
    envKey: z.string().regex(ENV_KEY),
    url: z.union([z.url(), z.literal("")]),
    offer: z.string().min(1),
    sckPrefix: z.string().regex(CODE).max(6),
  }),
  funnel: z.object({
    thanksPath: z.string().regex(THANKS_PATH),
    postPurchaseOffer: z.string().regex(SLUG).optional(),
  }),
  copy: z.custom<CoreLandingCopy>(isObject),
});

const Offer = Base.extend({
  kind: z.literal("post-purchase-offer"),
  pricing: z.object({ upsell: Price, downsell: Price }),
  parent: z.string().regex(SLUG),
  decision: z.literal("hotmart-widget"),
  copy: z.custom<OfferLandingCopy>(isObject),
});

export const ProductSchema = z.discriminatedUnion("kind", [Core, Offer]);

type Parsed = z.output<typeof ProductSchema>;

function checkRegistry(list: Parsed[], ctx: z.RefinementCtx): void {
  const slugs = new Map<string, Parsed>();
  const codes = new Set<string>();
  list.forEach((product, index) => {
    if (slugs.has(product.slug))
      ctx.addIssue({ code: "custom", path: [index, "slug"], message: "duplicate slug" });
    if (codes.has(product.code))
      ctx.addIssue({ code: "custom", path: [index, "code"], message: "duplicate code" });
    slugs.set(product.slug, product);
    codes.add(product.code);
  });
  list.forEach((product, index) => {
    const pages = product.resources.reduce((sum, resource) => sum + (resource.pages ?? 0), 0);
    if (pages !== product.composition.pageCount) {
      ctx.addIssue({
        code: "custom",
        path: [index, "resources"],
        message: `resource pages sum to ${pages}, composition declares ${product.composition.pageCount}`,
      });
    }
    if (product.kind === "core") checkCore(product, index, slugs, ctx);
    else checkOffer(product, index, slugs, ctx);
  });
  if (!list.some((product) => product.kind === "core")) {
    ctx.addIssue({ code: "custom", path: [], message: "the registry needs at least one core product" });
  }
}

function checkCore(
  product: Extract<Parsed, { kind: "core" }>,
  index: number,
  slugs: ReadonlyMap<string, Parsed>,
  ctx: z.RefinementCtx,
): void {
  if (product.funnel.thanksPath !== `/${product.slug}/gracias/`) {
    ctx.addIssue({
      code: "custom",
      path: [index, "funnel", "thanksPath"],
      message: "thanks page is served at /<slug>/gracias/ (src/app/[product]/gracias)",
    });
  }
  const offer = product.funnel.postPurchaseOffer;
  if (offer !== undefined && slugs.get(offer)?.kind !== "post-purchase-offer") {
    ctx.addIssue({
      code: "custom",
      path: [index, "funnel", "postPurchaseOffer"],
      message: `"${offer}" is not a post-purchase offer in the registry`,
    });
  }
}

function checkOffer(
  product: Extract<Parsed, { kind: "post-purchase-offer" }>,
  index: number,
  slugs: ReadonlyMap<string, Parsed>,
  ctx: z.RefinementCtx,
): void {
  if (slugs.get(product.parent)?.kind !== "core") {
    ctx.addIssue({
      code: "custom",
      path: [index, "parent"],
      message: `"${product.parent}" is not a core product in the registry`,
    });
  }
}

/** The whole registry: unique slugs and codes, resolvable funnel links, consistent page counts. */
export const RegistrySchema = z.array(ProductSchema).min(1).superRefine(checkRegistry);

/** Shape of a product module (`satisfies ProductInput`). */
export type ProductInput = z.input<typeof ProductSchema>;

type WithPath<T> = T extends { slug: string } ? T & { path: string } : never;

/** A parsed product plus its canonical trailing-slash path. */
export type Product = WithPath<Parsed>;
export type CoreProduct = Extract<Product, { kind: "core" }>;
export type OfferProduct = Extract<Product, { kind: "post-purchase-offer" }>;

/** `code.kind.01 … code.kind.NN`, the naming convention of `tools/media/sources.json`. */
export function mediaSequence(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}.${String(index + 1).padStart(2, "0")}`);
}
