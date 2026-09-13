import assert from "node:assert/strict";
import { test } from "node:test";
import { grafismoPageIds, grafismoResources, packPageIds, packResources } from "../../content/es/products.ts";
import { getImage, getVideo, hasMedia, mediaIds } from "../../src/lib/media.ts";

test("every media id referenced by content exists in the manifest", () => {
  const referenced = [
    "gf.hero",
    "pack.hero",
    "brand.isotipo",
    "gf.scene.mesa",
    "gf.scene.trazo",
    ...grafismoPageIds,
    ...packPageIds,
    ...grafismoResources.map((r) => r.card),
    ...packResources.map((r) => r.card),
  ];
  for (const id of referenced) assert.ok(hasMedia(id), `missing media id ${id}`);
  assert.ok(mediaIds.length >= referenced.length);
});

test("images expose explicit dimensions and a srcset; videos expose poster and text alternative", () => {
  const hero = getImage("gf.hero");
  assert.ok(hero.width > 0 && hero.height > 0);
  assert.match(hero.srcSet, /w480/);
  for (const id of ["video.gf.bota", "video.gf.mapa", "video.gf.paloma", "video.gf.maleta"]) {
    const video = getVideo(id);
    assert.match(video.mp4, /\.mp4$/);
    assert.ok(video.poster.src);
    assert.ok(video.title.length > 0 && video.description.length > 0, `text alternative for ${id}`);
  }
});

test("unknown ids throw at build time", () => {
  assert.throws(() => getImage("nope"), /nope/);
  assert.equal(hasMedia("nope"), false);
});
