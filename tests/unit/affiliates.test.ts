import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  affiliateExamplePath,
  affiliateHref,
  affiliates,
  alimentacionBebe,
} from "../../config/affiliates.ts";
import { homeCopy } from "../../content/es/home.ts";
import { hubCopy } from "../../content/es/hub.ts";
import { affiliateEnvNames, CHECKOUT_ENV_PATTERN } from "../../scripts/lib/edge-rules.ts";
import { hasMedia } from "../../src/lib/media.ts";

type RawRule = { source: string; destinationEnv?: string; permanent?: boolean };
const rawRules = (
  JSON.parse(readFileSync(new URL("../../config/edge-rules.json", import.meta.url), "utf8")) as {
    redirects: RawRule[];
  }
).redirects;
type ManifestItem = { id: string; rights: { redistribution: string }; provenance: { origin: string } };
const manifest = JSON.parse(readFileSync(new URL("../../media/manifest.json", import.meta.url), "utf8")) as {
  items: ManifestItem[];
};

test("the recommended course keeps its documented facts", () => {
  assert.equal(alimentacionBebe.slug, "alimentacion-bebe");
  assert.equal(alimentacionBebe.path, "/alimentacion-bebe/");
  assert.equal(alimentacionBebe.name, "Guía de Alimentación para Bebés");
  assert.equal(alimentacionBebe.platform, "Hotmart");
  assert.equal(alimentacionBebe.guaranteeDays, 7);
  assert.ok(alimentacionBebe.topics.length >= 3 && alimentacionBebe.topics.length <= 4);
  assert.equal(affiliateHref(alimentacionBebe), "/alimentacion-bebe/?src=sitio-home");
  assert.equal(affiliateExamplePath, "/alimentacion-bebe");
});

test("every affiliate path is a 302 edge redirect read from a checkout variable", () => {
  const envNames = affiliateEnvNames();
  for (const product of affiliates) {
    const rule = rawRules.find((r) => r.source === product.path);
    assert.ok(rule, `${product.path} has no rule in config/edge-rules.json`);
    assert.equal(rule.destinationEnv, product.destinationEnv);
    assert.equal(rule.permanent, false, "302 so the owner can change the link");
    assert.ok(envNames.includes(product.destinationEnv));
    assert.match(product.destinationEnv, CHECKOUT_ENV_PATTERN);
    assert.match(product.slug, /^[a-z0-9-]+$/);
  }
});

test("affiliate media exist, are approved for the public repo and declared as AI-generated", () => {
  for (const product of affiliates) {
    for (const id of Object.values(product.media)) {
      assert.ok(hasMedia(id), `missing media id ${id}`);
      const item = manifest.items.find((entry) => entry.id === id);
      assert.equal(item?.rights.redistribution, "public-repo-approved", id);
      assert.equal(item?.provenance.origin, "ai-generated", id);
    }
  }
});

test("affiliate copy: disclosure, no price, reviews or health promises", () => {
  const copy = homeCopy.affiliate;
  assert.equal(
    copy.disclosure,
    "Recomendación con enlace de afiliado: si compras, Pequeverso recibe una comisión. El curso es de un tercero; Hotmart gestiona el pago, la entrega y los reembolsos.",
  );
  // The short form shown wherever the course appears outside its chapter (doors, menus, close).
  assert.equal(
    hubCopy.feeding.disclosure,
    "Enlace de afiliado: si compras, Pequeverso recibe una comisión; a ti no te cuesta más.",
  );
  assert.equal(copy.cta, "Ver la guía en Hotmart");
  // Every piece of copy about the course: its chapter, its hub entry (doors, menu, sticky bar),
  // its closing button and the FAQ answers about it.
  const text = [
    JSON.stringify(copy),
    JSON.stringify(hubCopy.feeding),
    homeCopy.closing.feedingCta,
    ...homeCopy.faq.items.filter((item) => item.about === "feeding").flatMap((item) => [item.q, item.a]),
    ...affiliates.flatMap((p) => [p.name, p.audience, p.stage, ...p.topics]),
  ].join(" ");
  for (const forbidden of [
    /US\$|\$\s?\d|precio|descuento|oferta/i,
    /reseñ|opini|estrellas|testimoni|★/i,
    /garantiza(mos)?|asegura|resultados|sano|saludable|previene|cura|alergi/i,
    /\bvos\b|ten[ée]s\b|pod[ée]s\b/i,
  ])
    assert.doesNotMatch(text, forbidden);
});
