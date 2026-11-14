import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseSync } from "oxc-parser";
import { sourceFiles } from "../helpers/source-architecture.ts";

// OD-32 / OD-51. Small, conservative tripwires, not a general language detector.
export const COPY_RULES = {
  counters: [
    /(?:\bmás\s+de\s+|\+\s*)[\d.,]+\s+(?:familias|mamás|papás|madres|padres|docentes|niños|niñas|clientes|compradores|ventas|descargas)(?!\p{L})/iu,
    /\bmiles\s+de\b/iu,
  ],
  urgency: [
    /\bsolo hoy\b/iu,
    /(?<!\p{L})últimas horas\b/iu,
    /\bquedan pocas\b/iu,
    /\boferta termina\b/iu,
    /\b(cuenta regresiva|countdown)\b/iu,
    /\bsolo\s+por\s+hoy\b/iu,
    /(?<!\p{L})última\s+oportunidad\b/iu,
    /(?<!\p{L})últimos\s+(?:lugares|cupos)\b/iu,
    /\bpor\s+tiempo\s+limitado\b/iu,
    /\boferta\s+limitada\b/iu,
    /\bhasta\s+agotar\s+(?:stock|existencias)\b/iu,
  ],
  voseo: [
    /(?<!\p{L})(vos|descargá|imprimí|tenés|podés|querés|mirá|sabés|hacé|tené|comprá|elegí|pagá|empezá|sos|vosotros|vuestro|vuestra)(?!\p{L})/iu,
  ],
  regionalisms: [/\b(chavales|ordenador|guay|che|pibe)\b/iu, /(?<!\p{L})móvil(?!\p{L})/iu],
  formal: [/\b(usted|ustedes|su compra|sus archivos)\b/iu],
  english: [/\b(buy now|add to cart|download|free|checkout|sign up)\b/iu],
};
const NEGATIVE: Record<keyof typeof COPY_RULES, string[]> = {
  counters: [
    ...[
      "familias",
      "mamás",
      "papás",
      "madres",
      "padres",
      "docentes",
      "niños",
      "niñas",
      "clientes",
      "compradores",
      "ventas",
      "descargas",
    ].flatMap((noun) => [`Más de 1.000 ${noun}`, `+5000 ${noun}`]),
    "Miles de compradores",
  ],
  urgency: [
    "Solo hoy",
    "Últimas horas",
    "Quedan pocas plazas",
    "La oferta termina",
    "Cuenta regresiva",
    "Countdown",
    "Solo por hoy",
    "Última oportunidad",
    "Últimos lugares",
    "Últimos cupos",
    "Por tiempo limitado",
    "Oferta limitada",
    "Hasta agotar stock",
    "Hasta agotar existencias",
  ],
  voseo: [
    "vos",
    "descargá",
    "imprimí",
    "tenés",
    "podés",
    "querés",
    "mirá",
    "sabés",
    "hacé",
    "tené",
    "comprá",
    "elegí",
    "pagá",
    "empezá",
    "sos",
    "vosotros",
    "vuestro",
    "vuestra",
  ],
  regionalisms: ["chavales", "ordenador", "guay", "che", "pibe", "móvil"],
  formal: ["Usted puede descargar", "Ustedes reciben", "Su compra", "Sus archivos"],
  english: ["Buy now", "Add to cart", "Download", "Free", "Checkout", "Sign up"],
};
// Legal quotations/statutory third-person language are exempt only from the tú rule.
// No store-copy exemption; old-domain.test.ts owns OD-53; commerce.test.ts owns formatUsd.
const KNOWN_FINDINGS: string[] = [];

const visibleAttributes = new Set(["aria-label", "title", "alt", "placeholder", "label"]);

function literals(value: unknown, visibleOnly = false): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((child) => literals(child, visibleOnly));
  const node = value as Record<string, unknown>;
  if (node.type === "ImportDeclaration") return [];
  if (node.type === "JSXText") {
    const text = String(node.value).trim();
    return text ? [text] : [];
  }
  if (node.type === "JSXAttribute")
    return visibleAttributes.has((node.name as { name: string }).name) ? literals(node.value) : [];
  if (node.type === "JSXExpressionContainer") return literals(node.expression);
  // Icon names select artwork; their adjacent label/text is the visible copy.
  if (node.type === "Property") {
    const key = node.key as { name?: string; value?: string };
    if (/^(?:icon|className|href|src|data-.*)$/.test(key.name ?? key.value ?? "")) return [];
  }
  if (String(node.type).startsWith("TS")) return literals(node.expression, visibleOnly);
  if (node.type === "Literal" && typeof node.value === "string")
    return visibleOnly ? [] : [node.value];
  if (node.type === "TemplateElement")
    return visibleOnly ? [] : [(node.value as { cooked: string }).cooked];
  return Object.entries(node).flatMap(([key, child]) =>
    key === "key" ? [] : literals(child, visibleOnly),
  );
}

function scanCopy(
  files: readonly { path: string; source: string }[],
  rules: Record<string, readonly RegExp[]>,
): string[] {
  const findings: string[] = [];
  for (const { path, source } of files) {
    const parsed = parseSync(path, source);
    assert.deepEqual(parsed.errors, [], path);
    const visibleOnly = path.startsWith("src/");
    for (const text of literals(parsed.program, visibleOnly)) {
      if (/^https?:\/\/|^mailto:|^\/[\w/-]*$|^\.\/|^#[\w-]+$/.test(text)) continue;
      for (const [rule, patterns] of Object.entries(rules)) {
        if (rule === "english" && !visibleOnly && !path.startsWith("content/")) continue;
        if (rule === "formal" && /^(?:src\/views\/legal|content\/es\/legal)\//.test(path)) continue;
        if (patterns.some((pattern) => pattern.test(text)))
          findings.push(`${rule}: ${path}: ${text}`);
      }
    }
  }
  return findings.sort();
}

const copyFiles = ["content", "config", "src/views", "src/shell", "src/features", "src/app"]
  .flatMap(sourceFiles)
  .filter((path) => /\.tsx?$/.test(path))
  .map((path) => ({ path, source: readFileSync(path, "utf8") }));

for (const [rule, patterns] of Object.entries(COPY_RULES)) {
  test(`${rule}: negative fixtures trigger every pattern`, () => {
    for (const text of NEGATIVE[rule as keyof typeof COPY_RULES])
      assert.ok(
        patterns.some((pattern) => pattern.test(text)),
        text,
      );
    for (const pattern of patterns)
      assert.ok(
        NEGATIVE[rule as keyof typeof COPY_RULES].some((text) => pattern.test(text)),
        String(pattern),
      );
  });
  test(`${rule}: customer copy has no new findings`, () => {
    assert.deepEqual(
      scanCopy(copyFiles, { [rule]: patterns }),
      KNOWN_FINDINGS.filter((entry) => entry.startsWith(`${rule}:`)).sort(),
    );
  });
}

test("neutral Spanish and configured material counts are not banned", () => {
  for (const text of [
    "Descarga e imprime",
    "Tú puedes elegir",
    "Tu compra",
    "9 PDF y 414 páginas",
    "El intervalo es válido",
  ])
    for (const patterns of Object.values(COPY_RULES))
      for (const pattern of patterns) assert.doesNotMatch(text, pattern);
});

test("copy extraction includes const assertions, satisfies and template text, excluding imports and types", () => {
  const source = `import { x } from "Download"; type T = "Free"; const a = {icon: "download", label: "Buy now"} as const; const b = {label: \`Add to cart \${x}\`} satisfies T;`;
  assert.deepEqual(literals(parseSync("fixture.ts", source).program), [
    "Buy now",
    "Add to cart ",
    "",
  ]);
});

test("JSX extraction includes visible text and attributes, excluding machine values", () => {
  const source = `import Icon from "Download";
    const machine = "Checkout";
    const view = <section className={"Free"} data-label="Download" href="Buy now" src="Free">
      Texto visible
      <input aria-label="Nombre" title={"Ayuda"} alt="Imagen" placeholder="Escribe aquí" label="Etiqueta" />
      {"Descarga ahora"}{ready ? "Listo" : "Espera"}
      <Icon className="download" />
    </section>;`;
  const parsed = parseSync("fixture.tsx", source);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(literals(parsed.program, true), [
    "Texto visible",
    "Nombre",
    "Ayuda",
    "Imagen",
    "Escribe aquí",
    "Etiqueta",
    "Descarga ahora",
    "Listo",
    "Espera",
  ]);
});

test("scanCopy reports violating content and JSX through the complete scanner", () => {
  assert.deepEqual(
    scanCopy(
      [
        { path: "content/es/fixture.ts", source: 'const copy = {label: "Solo por hoy"};' },
        { path: "src/views/fixture.tsx", source: "const view = <p>Descargá ahora</p>;" },
      ],
      COPY_RULES,
    ),
    [
      "urgency: content/es/fixture.ts: Solo por hoy",
      "voseo: src/views/fixture.tsx: Descargá ahora",
    ],
  );
  // Exercise every negative fixture through extraction, not just the regular expressions.
  for (const [rule, texts] of Object.entries(NEGATIVE))
    for (const text of texts)
      assert.deepEqual(
        scanCopy(
          [
            {
              path: "content/es/fixture.ts",
              source: `const copy = {label: ${JSON.stringify(text)}};`,
            },
          ],
          { [rule]: COPY_RULES[rule as keyof typeof COPY_RULES] },
        ),
        [`${rule}: content/es/fixture.ts: ${text}`],
      );
});

test("scanCopy scopes exemptions and skips only real URL and path shapes", () => {
  assert.deepEqual(
    scanCopy(
      [
        { path: "src/views/legal/fixture.tsx", source: "const view = <p>Usted: Download</p>;" },
        { path: "content/es/legal/fixture.ts", source: 'const copy = {label: "Usted: Download"};' },
        { path: "config/fixture.ts", source: 'const config = {id: "Download"};' },
        { path: "src/views/fixture.tsx", source: "const view = <p>Usted</p>;" },
      ],
      COPY_RULES,
    ),
    [
      "english: content/es/legal/fixture.ts: Usted: Download",
      "english: src/views/legal/fixture.tsx: Usted: Download",
      "formal: src/views/fixture.tsx: Usted",
    ],
  );
  const labels = [
    "https://example.test/Download",
    "http://example.test/Download",
    "mailto:Download@example.test",
    "/Download/",
    "./Download",
    "#Download",
    ". Download",
    "# Download",
    "@Download",
  ];
  assert.deepEqual(
    scanCopy(
      [{ path: "content/es/fixture.ts", source: `const copy = ${JSON.stringify(labels)};` }],
      COPY_RULES,
    ),
    [
      "english: content/es/fixture.ts: # Download",
      "english: content/es/fixture.ts: . Download",
      "english: content/es/fixture.ts: @Download",
    ],
  );
});
