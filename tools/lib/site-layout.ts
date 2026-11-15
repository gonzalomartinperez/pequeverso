/**
 * Where the post-build checks (check-bundle-budget, check-rendered, check-links) read the built
 * site. By default that is the static export `out/`; `SITE_DIR=<dir>` points them at a standalone
 * site assembled by `tools/ci/assemble-site.ts`, whose files live elsewhere:
 *
 *   export  out/index.html, out/x/index.html, out/_next/static/*, out/media/*
 *   site    <dir>/.next/server/app/index.html, <dir>/.next/server/app/x.html,
 *           <dir>/.next/static/*, <dir>/public/media/*
 *
 * Page names are always reported export-style (`x/index.html`), so messages and per-route rules
 * are identical for both layouts.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export type Layout = {
  mode: "export" | "site";
  /** Absolute directory (`out/` or the assembled site). */
  root: string;
  /** What to tell the user to build when it is missing. */
  label: string;
};
export type Page = { file: string; name: string };

/** The site's bare global-error shell: prerendered, but it has no landmarks, h1 or canonical. */
const errorShell = "_global-error/index.html";
const staticPrefix = "/_next/static/";

export function layoutFor(cwd: string, env: Record<string, string | undefined>): Layout {
  const site = env.SITE_DIR;
  if (site) return { mode: "site", root: resolve(cwd, site), label: `${site}/` };
  return { mode: "export", root: resolve(cwd, "out"), label: "out/" };
}

const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();
const isDirectory = (path: string): boolean => existsSync(path) && statSync(path).isDirectory();
/** Code-point order: identical on every machine and locale (unlike `localeCompare`). */
const byName = (a: Page, b: Page): number => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

function walkHtml(directory: string, found: string[] = []): string[] {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(full, found);
    else if (entry.name.endsWith(".html")) found.push(full);
  }
  return found;
}

/** `x.html` -> `x/index.html` (the export name), `index.html` stays. */
export function exportStyleName(appRelative: string): string {
  const base = appRelative.split("\\").join("/");
  return base === "index.html" ? base : `${base.replace(/\.html$/, "")}/index.html`;
}

const pagesRoot = (layout: Layout): string =>
  layout.mode === "site" ? join(layout.root, ".next/server/app") : layout.root;

/**
 * What to print when there is nothing to read, or null. A site needs its prerendered pages
 * (`.next/server/app`); an empty or unrelated SITE_DIR fails like a missing one, not with a stack.
 */
export function missingLayout(layout: Layout, tool: string): string | null {
  if (isDirectory(layout.mode === "site" ? pagesRoot(layout) : layout.root)) return null;
  const hint = layout.mode === "site" ? "node tools/ci/assemble-site.ts" : "npm run build";
  return `${tool}: ${layout.label} not found; run \`${hint}\` first`;
}

/** Every prerendered HTML page, sorted by name (code point). */
export function listPages(layout: Layout): Page[] {
  const base = pagesRoot(layout);
  return walkHtml(base)
    .map((file) => {
      const name = relative(base, file).split("\\").join("/");
      return { file, name: layout.mode === "site" ? exportStyleName(name) : name };
    })
    .sort(byName);
}

/**
 * Pages with route semantics (`index.html`/`404.html`). In a site the bare error shell is not a
 * route; see `listErrorShells`. An export keeps every page, as it always has.
 */
export function listRoutePages(layout: Layout): Page[] {
  return listPages(layout).filter(({ name }) => {
    if (layout.mode === "site" && name === errorShell) return false;
    return /(^|\/)(index|404)\.html$/.test(name);
  });
}

/** Site pages that are not routes and only get text checks (never landmarks or h1). */
export function listErrorShells(layout: Layout): Page[] {
  return layout.mode === "site" ? listPages(layout).filter(({ name }) => name === errorShell) : [];
}

/** Prerendered HTML for a route such as `/` or `/x/`. */
export function pageFile(layout: Layout, route: string): string {
  const path = route.replace(/^\/|\/$/g, "");
  if (layout.mode === "export")
    return join(layout.root, path ? `${path}/index.html` : "index.html");
  return join(pagesRoot(layout), path ? `${path}.html` : "index.html");
}

/** The file behind a built asset URL such as `/_next/static/chunks/a.js` or `/media/a.webp`. */
export function assetFile(layout: Layout, urlPath: string): string {
  if (layout.mode === "export") return join(layout.root, urlPath);
  if (urlPath.startsWith(staticPrefix)) {
    return join(layout.root, ".next/static", urlPath.slice(staticPrefix.length));
  }
  return join(layout.root, "public", urlPath);
}

/** Files a URL path may resolve to: the asset itself, a route page, or a metadata route body. */
export function linkCandidates(layout: Layout, urlPath: string): string[] {
  if (layout.mode === "export") {
    const { root } = layout;
    return [join(root, urlPath), join(root, urlPath, "index.html"), join(root, `${urlPath}.html`)];
  }
  const route = urlPath.replace(/\/+$/, "");
  return [
    assetFile(layout, urlPath),
    pageFile(layout, route || "/"),
    join(pagesRoot(layout), `${route}.body`),
  ];
}

export const resolvesToFile = (layout: Layout, urlPath: string): boolean =>
  linkCandidates(layout, urlPath).some(isFile);
