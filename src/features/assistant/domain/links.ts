/**
 * URL policy. Every URL the UI renders or acts on (product pages, purchase sections, images,
 * links, sources and links inside answer text) is untrusted until it passes here, even though the
 * API allowlists them too. Answer text never produces links (see rich-text.ts). Pure: uses only
 * the WHATWG `URL` parser.
 */
import type { Message, Product, Resource } from "./models.ts";

export type LinkPolicy = {
  /** Exact storefront origin, e.g. "https://pequeverso.com" (no www variant is implied). */
  storefrontOrigin: string;
  /** Exact extra hosts allowed for informational links (https only), e.g. "consumer.hotmart.com". */
  linkHosts: readonly string[];
};

/** Backslash or a C0/DEL control character: the URL parser would silently normalize them away. */
function hasUnsafeCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code === 0x5c || code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function parse(value: string): URL | null {
  // Backslashes and control characters can turn a path into a protocol-relative reference
  // ("/\\evil.com" becomes "//evil.com"); refuse them outright.
  if (typeof value !== "string" || value.length > 2048 || hasUnsafeCharacters(value)) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

/** A URL on the exact storefront origin (the only destination for product and purchase actions). */
export function storefrontUrl(value: string, policy: LinkPolicy): string | null {
  const url = parse(value);
  if (!url || url.origin !== policy.storefrontOrigin) return null;
  // A path starting with "//" would become a protocol-relative link once used as a same-tab href.
  return url.pathname.startsWith("//") ? null : url.href;
}

/**
 * The same-tab href for a storefront URL that already passed `storefrontUrl`: an absolute path
 * that always starts with exactly one slash. Returns null for anything else.
 */
export function storefrontPath(value: string, policy: LinkPolicy): string | null {
  const safe = storefrontUrl(value, policy);
  if (!safe) return null;
  const url = new URL(safe);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** A link the visitor may open in a new tab: the storefront, or https on an allowlisted host. */
export function externalUrl(value: string, policy: LinkPolicy): string | null {
  const url = parse(value);
  if (!url) return null;
  if (url.origin === policy.storefrontOrigin) return storefrontUrl(value, policy);
  return url.protocol === "https:" && policy.linkHosts.includes(url.hostname) ? url.href : null;
}

function safeImage<T extends { image: Product["image"] }>(item: T, policy: LinkPolicy): T {
  if (!item.image) return item;
  const url = storefrontUrl(item.image.url, policy);
  return { ...item, image: url ? { ...item.image, url } : null };
}

/**
 * Drops references whose URLs fail the policy instead of rendering a broken or foreign action.
 * A product card needs both a valid product page and purchase section on the storefront.
 */
export function applyLinkPolicy(message: Message, policy: LinkPolicy): Message {
  const products: Product[] = [];
  for (const product of message.products) {
    const url = storefrontUrl(product.url, policy);
    const purchaseUrl = storefrontUrl(product.purchaseUrl, policy);
    if (url && purchaseUrl) products.push(safeImage({ ...product, url, purchaseUrl }, policy));
  }
  const resources: Resource[] = message.resources.map((resource) => safeImage(resource, policy));
  const links = message.links.flatMap((link) => {
    const url = externalUrl(link.url, policy);
    return url ? [{ ...link, url }] : [];
  });
  const sources = message.sources.flatMap((source) => {
    const url = externalUrl(source.url, policy);
    return url ? [{ ...source, url }] : [];
  });
  return { ...message, products, resources, links, sources };
}
