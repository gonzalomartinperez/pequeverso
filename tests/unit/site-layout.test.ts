import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import {
  assetFile,
  exportStyleName,
  type Layout,
  layoutFor,
  linkCandidates,
  listErrorShells,
  listPages,
  listRoutePages,
  pageFile,
  resolvesToFile,
} from "../../tools/lib/site-layout.ts";
import { cleanEnv, runCli } from "./cli-process.ts";

const tools = (name: string) => new URL(`../../tools/${name}.ts`, import.meta.url).pathname;

/** A structurally valid page (what tools/check-rendered.ts requires of every route). */
const page = (body = "", { canonical = true } = {}) =>
  `<html lang="es"><head>${canonical ? '<link rel="canonical" href="/">' : ""}</head><body>` +
  `<header></header><a href="#contenido">Saltar</a><main id="contenido"><h1>Titulo</h1>${body}</main>` +
  "<footer></footer></body></html>";
const bare = '<html lang="es"><body>global error</body></html>';

const budgets = {
  default: { html: 10_000, js: 10_000, css: 10_000 },
  routes: { "/": {}, "/soporte/": { js: 50 } },
};

function put(root: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
}

/** The same logical site in both layouts: pages keyed by export name. */
function writeLayout(root: string, mode: "export" | "site", pages: Record<string, string>): void {
  const files: Record<string, string> = {};
  for (const [name, html] of Object.entries(pages)) {
    if (mode === "export") files[`out/${name}`] = html;
    else files[`site/.next/server/app/${name.replace(/\/index\.html$/, ".html")}`] = html;
  }
  put(root, files);
}

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "pv-site-layout-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const run = (tool: string, root: string, env: Record<string, string> = {}, args: string[] = []) =>
  runCli(tools(tool), args, root, { ...cleanEnv(), SITE_DIR: "", ...env });

test("layoutFor defaults to out/ and follows SITE_DIR", () => {
  assert.deepEqual(layoutFor("/work", {}), { mode: "export", root: "/work/out", label: "out/" });
  assert.deepEqual(layoutFor("/work", { SITE_DIR: "" }), {
    mode: "export",
    root: "/work/out",
    label: "out/",
  });
  assert.deepEqual(layoutFor("/work", { SITE_DIR: "site" }), {
    mode: "site",
    root: "/work/site",
    label: "site/",
  });
  assert.equal(layoutFor("/work", { SITE_DIR: "/abs/site" }).root, "/abs/site");
});

test("site paths map routes, static files and public files like the export", () => {
  const site: Layout = { mode: "site", root: "/s", label: "s/" };
  const out: Layout = { mode: "export", root: "/o", label: "out/" };
  assert.equal(exportStyleName("index.html"), "index.html");
  assert.equal(exportStyleName("x.html"), "x/index.html");
  assert.equal(exportStyleName("a/b.html"), "a/b/index.html");
  assert.equal(pageFile(site, "/"), "/s/.next/server/app/index.html");
  assert.equal(pageFile(site, "/x/"), "/s/.next/server/app/x.html");
  assert.equal(pageFile(site, "/a/b/"), "/s/.next/server/app/a/b.html");
  assert.equal(pageFile(out, "/"), "/o/index.html");
  assert.equal(pageFile(out, "/x/"), "/o/x/index.html");
  assert.equal(assetFile(site, "/_next/static/chunks/a.js"), "/s/.next/static/chunks/a.js");
  assert.equal(assetFile(site, "/media/a.webp"), "/s/public/media/a.webp");
  assert.equal(assetFile(out, "/_next/static/chunks/a.js"), "/o/_next/static/chunks/a.js");
  assert.deepEqual(linkCandidates(site, "/x/"), [
    "/s/public/x/",
    "/s/.next/server/app/x.html",
    "/s/.next/server/app/x.body",
  ]);
  assert.deepEqual(linkCandidates(out, "/x/"), ["/o/x/", "/o/x/index.html", "/o/x/.html"]);
});

test("listPages names pages export-style and listRoutePages drops the bare error shell", () => {
  withRoot((root) => {
    writeLayout(root, "site", {
      "index.html": page(),
      "soporte/index.html": page(),
      "grafismo-fonetico/gracias/index.html": page(),
      "_not-found/index.html": page("", { canonical: false }),
      "_global-error/index.html": bare,
    });
    put(root, { "site/.next/server/app/index.rsc": "x", "site/.next/server/app/robots.txt": "x" });
    const layout = layoutFor(root, { SITE_DIR: "site" });
    const names = ["_global-error", "_not-found", "grafismo-fonetico/gracias", "soporte"].map(
      (name) => `${name}/index.html`,
    );
    assert.deepEqual(
      listPages(layout).map((entry) => entry.name),
      [
        "_global-error/index.html",
        "_not-found/index.html",
        "grafismo-fonetico/gracias/index.html",
        "index.html",
        "soporte/index.html",
      ],
    );
    assert.deepEqual(
      listRoutePages(layout).map((entry) => entry.name),
      names
        .filter((name) => name !== "_global-error/index.html")
        .concat("index.html")
        .sort(),
    );
  });
  withRoot((root) => {
    writeLayout(root, "export", {
      "index.html": page(),
      "404.html": page(),
      "x/index.html": page(),
    });
    put(root, { "out/robots.txt": "x", "out/x/index.txt": "x" });
    assert.deepEqual(
      listRoutePages(layoutFor(root, {})).map((entry) => entry.name),
      ["404.html", "index.html", "x/index.html"],
    );
  });
});

test("listRoutePages keeps _global-error in an export and drops it only in a site", () => {
  withRoot((root) => {
    const pages = { "index.html": page(), "_global-error/index.html": bare };
    writeLayout(root, "export", pages);
    writeLayout(root, "site", pages);
    assert.deepEqual(
      listRoutePages(layoutFor(root, {})).map((entry) => entry.name),
      ["_global-error/index.html", "index.html"],
    );
    assert.deepEqual(listErrorShells(layoutFor(root, {})), []);
    const site = layoutFor(root, { SITE_DIR: "site" });
    assert.deepEqual(
      listRoutePages(site).map((entry) => entry.name),
      ["index.html"],
    );
    assert.deepEqual(
      listErrorShells(site).map((entry) => entry.name),
      ["_global-error/index.html"],
    );
    // The export's shell is checked like any page: landmarks and all.
    const exported = run("check-rendered", root);
    assert.equal(exported.status, 1);
    assert.match(exported.stderr, /✖ _global-error\/index\.html: missing <main>/);
  });
});

test("pages are listed in code-point order, whatever the creation order or locale", () => {
  withRoot((root) => {
    const names = ["soporte", "alpha", "_z", "Zeta", "B"];
    for (const name of names) writeLayout(root, "site", { [`${name}/index.html`]: page() });
    writeLayout(root, "site", { "index.html": page() });
    for (const name of [...names].reverse())
      writeLayout(root, "export", { [`${name}/index.html`]: page() });
    writeLayout(root, "export", { "index.html": page() });
    // `localeCompare` would put alpha before B and Zeta; code points put every capital first.
    const expected = [
      "B/index.html",
      "Zeta/index.html",
      "_z/index.html",
      "alpha/index.html",
      "index.html",
      "soporte/index.html",
    ];
    for (const env of [{ SITE_DIR: "site" }, {}]) {
      const layout = layoutFor(root, env);
      assert.deepEqual(
        listPages(layout).map((entry) => entry.name),
        expected,
      );
      assert.deepEqual(
        listRoutePages(layout).map((entry) => entry.name),
        expected,
      );
    }
  });
});

test("check-rendered applies only the text rules to the site's _global-error shell", () => {
  withRoot((root) => {
    const shell = (html: string) =>
      writeLayout(root, "site", { "index.html": page(), "_global-error/index.html": html });
    const failures = (html: string) => {
      shell(html);
      return run("check-rendered", root, { SITE_DIR: "site" });
    };
    const clean = failures('<html lang="es"><body>Algo salio mal</body></html>');
    assert.equal(clean.status, 0, clean.stderr);
    for (const [label, html, message] of [
      [
        "placeholder",
        '<html lang="es"><body>[[OWNER_DETAIL]]</body></html>',
        "contains an owner placeholder",
      ],
      [
        "forbidden text",
        '<html lang="es"><body>Trazos y Sonidos</body></html>',
        'contains "Trazos y Sonidos"',
      ],
      ["language", "<html><body>error</body></html>", 'missing lang="es"'],
      [
        "usd price",
        '<html lang="es"><body>US$ 19</body></html>',
        'shows a US$ price without the "moneda local" wording',
      ],
    ] as const) {
      const result = failures(html);
      assert.equal(result.status, 1, label);
      assert.equal(result.stderr, `✖ _global-error/index.html: ${message}\n`, label);
    }
  });
});

test("every check fails cleanly, without a stack trace, for an empty or unassembled SITE_DIR", () => {
  withRoot((root) => {
    mkdirSync(join(root, "empty"));
    mkdirSync(join(root, "unbuilt/.next/server"), { recursive: true });
    put(root, {
      "config/budgets.json": JSON.stringify(budgets),
      "notdir/.next/server/app": "a file, not a directory",
    });
    for (const [tool, prefix] of [
      ["check-rendered", "check-rendered"],
      ["check-links", "check-links"],
      ["check-bundle-budget", "check-bundle"],
    ] as const) {
      for (const dir of ["empty", "unbuilt", "notdir"]) {
        const result = run(tool, root, { SITE_DIR: dir });
        const label = `${tool} ${dir}`;
        assert.equal(result.status, 1, label);
        assert.equal(result.stdout, "", label);
        assert.equal(
          result.stderr,
          `${prefix}: ${dir}/ not found; run \`node tools/ci/assemble-site.ts\` first\n`,
          label,
        );
      }
    }
  });
});

test("resolvesToFile finds routes, assets and metadata bodies, and never site internals", () => {
  withRoot((root) => {
    put(root, {
      "site/.next/server/app/index.html": page(),
      "site/.next/server/app/soporte.html": page(),
      "site/.next/server/app/sitemap.xml.body": "<urlset/>",
      "site/.next/static/chunks/a.js": "//",
      "site/public/media/a.webp": "w",
      "site/server.js": "//",
    });
    const layout = layoutFor(root, { SITE_DIR: "site" });
    for (const path of [
      "/",
      "/soporte/",
      "/soporte",
      "/sitemap.xml",
      "/_next/static/chunks/a.js",
      "/media/a.webp",
    ]) {
      assert.equal(resolvesToFile(layout, path), true, path);
    }
    for (const path of [
      "/missing/",
      "/chunks/a.js",
      "/.next/static/chunks/a.js",
      "/server.js",
      "/media/",
      "/soporte/x/",
    ]) {
      assert.equal(resolvesToFile(layout, path), false, path);
    }
  });
});

test("check-rendered passes the same pages in both layouts with a clean global error shell", () => {
  withRoot((root) => {
    const pages = {
      "index.html": page(),
      "soporte/index.html": page(),
      "_not-found/index.html": page("", { canonical: false }),
    };
    writeLayout(root, "site", { ...pages, "_global-error/index.html": bare });
    const site = run("check-rendered", root, { SITE_DIR: "site" });
    assert.equal(site.status, 0, site.stderr);
    assert.equal(site.stdout, "check-rendered: 3 pages pass structural checks\n");
    writeLayout(root, "export", {
      "index.html": page(),
      "soporte/index.html": page(),
      "404.html": page("", { canonical: false }),
    });
    const exported = run("check-rendered", root);
    assert.equal(exported.status, 0, exported.stderr);
    assert.equal(exported.stdout, "check-rendered: 3 pages pass structural checks\n");
  });
});

test("check-rendered reports failures by export-style page name and a missing site", () => {
  withRoot((root) => {
    writeLayout(root, "site", {
      "index.html": page(),
      "soporte/index.html": page("<p>[[OWNER_DETAIL]]</p>"),
      "x/index.html": page('<a href="#nada">x</a>'),
    });
    const result = run("check-rendered", root, { SITE_DIR: "site" });
    assert.equal(result.status, 1);
    assert.equal(
      result.stderr,
      "✖ soporte/index.html: contains an owner placeholder\n✖ x/index.html: anchor #nada has no target\n",
    );
    const missing = run("check-rendered", root, { SITE_DIR: "nope" });
    assert.equal(missing.status, 1);
    assert.equal(
      missing.stderr,
      "check-rendered: nope/ not found; run `node tools/ci/assemble-site.ts` first\n",
    );
    const noExport = run("check-rendered", join(root, "site"));
    assert.equal(noExport.status, 1);
    assert.equal(noExport.stderr, "check-rendered: out/ not found; run `npm run build` first\n");
  });
});

test("check-links resolves routes, static and public files in a site, and reports the rest", () => {
  withRoot((root) => {
    const links = [
      "/soporte/",
      "/_next/static/chunks/a.js",
      "/media/a.webp?v=1",
      "/favicon.ico",
      "/sitemap.xml",
      "/#top",
      "//cdn.example/x.js",
    ];
    writeLayout(root, "site", {
      "index.html": page(links.map((href) => `<a href="${href}">x</a>`).join("")),
      "soporte/index.html": page(),
    });
    put(root, {
      "site/.next/server/app/sitemap.xml.body": "<urlset/>",
      "site/.next/static/chunks/a.js": "//",
      "site/public/media/a.webp": "w",
      "site/public/favicon.ico": "i",
    });
    const ok = run("check-links", root, { SITE_DIR: "site" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.equal(ok.stdout, "check-links: 2 pages, all internal references resolve\n");
    put(root, {
      "site/.next/server/app/soporte.html": page(
        '<a href="/missing/">m</a><img src="/chunks/a.js"><script src="/_next/static/gone.js"></script>',
      ),
    });
    const broken = run("check-links", root, { SITE_DIR: "site" });
    assert.equal(broken.status, 1);
    assert.equal(
      broken.stderr,
      "✖ /soporte/index.html → /missing/\n✖ /soporte/index.html → /chunks/a.js\n✖ /soporte/index.html → /_next/static/gone.js\n",
    );
    const missing = run("check-links", root, { SITE_DIR: "nope" });
    assert.equal(missing.status, 1);
    assert.equal(
      missing.stderr,
      "check-links: nope/ not found; run `node tools/ci/assemble-site.ts` first\n",
    );
  });
});

test("check-links keeps the export semantics when SITE_DIR is unset", () => {
  withRoot((root) => {
    writeLayout(root, "export", {
      "index.html": page(
        '<a href="/soporte/">s</a><a href="/missing/">m</a><a href="/_next/static/a.js">j</a>',
      ),
      "soporte/index.html": page(),
    });
    put(root, { "out/_next/static/a.js": "//" });
    const result = run("check-links", root);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "✖ /index.html → /missing/\n");
  });
});

test("check-bundle-budget measures a site like the export and enforces the same budgets", () => {
  withRoot((root) => {
    const html = page(
      '<script src="/_next/static/chunks/a.js"></script><script src="/_next/static/chunks/polyfills-x.js"></script>' +
        '<link rel="stylesheet" href="/_next/static/css/s.css">',
    );
    const js = "console.log('chunk');\n".repeat(40);
    const css = "a{color:red}\n".repeat(40);
    put(root, { "config/budgets.json": JSON.stringify(budgets) });
    writeLayout(root, "site", { "index.html": html, "soporte/index.html": html });
    put(root, {
      "site/.next/static/chunks/a.js": js,
      "site/.next/static/chunks/polyfills-x.js": "p".repeat(5000),
      "site/.next/static/css/s.css": css,
    });
    writeLayout(root, "export", { "index.html": html, "soporte/index.html": html });
    put(root, {
      "out/_next/static/chunks/a.js": js,
      "out/_next/static/chunks/polyfills-x.js": "p".repeat(5000),
      "out/_next/static/css/s.css": css,
    });
    const gz = (text: string) => gzipSync(text, { level: 9 }).length / 1024;
    const expected = [
      { route: "/", metric: "html", kb: gz(html) },
      { route: "/", metric: "js", kb: gz(js) },
      { route: "/", metric: "css", kb: gz(css) },
      { route: "/soporte/", metric: "html", kb: gz(html) },
      { route: "/soporte/", metric: "js", kb: gz(js) },
      { route: "/soporte/", metric: "css", kb: gz(css) },
    ];
    const measured = (env: Record<string, string>) => {
      const file = join(root, `rows-${env.SITE_DIR || "out"}.json`);
      const result = run("check-bundle-budget", root, env, ["--json", file]);
      return { result, rows: JSON.parse(readFileSync(file, "utf8")) };
    };
    const site = measured({ SITE_DIR: "site" });
    const exported = measured({});
    assert.deepEqual(site.rows, expected);
    assert.deepEqual(exported.rows, expected);
    assert.equal(site.result.stdout, exported.result.stdout);
    // The /soporte/ js budget (50 bytes) is exceeded in both layouts, `/` stays within budget.
    for (const { result } of [site, exported]) {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /^✖ \/soporte\/ js \d+\.\d KB > 0\.0 KB\n$/);
      assert.match(result.stdout, /\| \/ \| js \| \d+\.\d KB \| 9\.8 KB \| ✅ \|/);
    }
  });
});

test("check-bundle-budget fails clearly for a missing site and passes within budget", () => {
  withRoot((root) => {
    put(root, {
      "config/budgets.json": JSON.stringify({ default: budgets.default, routes: { "/": {} } }),
      "out/index.html": page(),
      "site/.next/server/app/index.html": page(),
    });
    const site = run("check-bundle-budget", root, { SITE_DIR: "site" });
    assert.equal(site.status, 0, site.stderr);
    assert.match(site.stdout, /check-bundle: all routes within budget\n$/);
    const missing = run("check-bundle-budget", root, { SITE_DIR: "nope" });
    assert.equal(missing.status, 1);
    assert.equal(
      missing.stderr,
      "check-bundle: nope/ not found; run `node tools/ci/assemble-site.ts` first\n",
    );
  });
});
