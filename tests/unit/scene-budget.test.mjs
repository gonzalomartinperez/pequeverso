import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SceneBudgetPlugin } from "../../scripts/scene-budget-plugin.mjs";
import {
  buildStarfield,
  buildStaticLayers,
  DEPTH_LAYERS,
  TILE_STARS,
} from "../../src/motion/scene/starfield.ts";

function runPlugin(chunks, identifier) {
  const directory = mkdtempSync(path.join(tmpdir(), "pv-scene-budget-"));
  mkdirSync(path.join(directory, ".next"));
  try {
    let done;
    new SceneBudgetPlugin().apply({
      context: directory,
      hooks: {
        done: {
          tap: (_name, fn) => {
            done = fn;
          },
        },
      },
    });
    done({
      compilation: {
        chunks,
        chunkGraph: { getChunkModulesIterable: () => [{ identifier: () => identifier }] },
      },
    });
    return JSON.parse(readFileSync(path.join(directory, ".next/scene-budget.json"), "utf8"));
  } finally {
    rmSync(directory, { recursive: true });
  }
}

test("the seeded starfield and its static tile are deterministic and complete", () => {
  assert.deepEqual(buildStarfield(), buildStarfield());
  const layers = buildStaticLayers();
  assert.deepEqual(layers, buildStaticLayers());
  assert.ok(layers.length <= DEPTH_LAYERS * 2);
  const squares = layers.flatMap((layer) => layer.path.match(/M[^z]+z/g) ?? []);
  assert.equal(squares.length, TILE_STARS);
});

test("scene budget follows extracted vendors and nested asynchronous chunks", () => {
  const scene = { files: ["static/chunks/scene.js"], groupsIterable: [], canBeInitial: () => false };
  const vendor = { files: ["static/chunks/three.js"], canBeInitial: () => false };
  const nested = { files: ["static/chunks/nested.js"], canBeInitial: () => false };
  scene.groupsIterable.push({
    chunks: [scene, vendor],
    childrenIterable: [{ chunks: [nested], childrenIterable: [] }],
  });
  const report = runPlugin([scene], "C:/repo/src/motion/scene/scene-runtime.ts|app-pages-browser");
  assert.deepEqual(report.files, [
    "static/chunks/nested.js",
    "static/chunks/scene.js",
    "static/chunks/three.js",
  ]);
  assert.equal(report.initial, false);
  assert.equal(report.roots, 1);
});

test("the report marks a scene that leaked into an initial chunk", () => {
  const chunk = { files: ["static/chunks/main.js"], groupsIterable: [], canBeInitial: () => true };
  const report = runPlugin([chunk], "/repo/src/motion/scene/scene-runtime.ts");
  assert.equal(report.initial, true);
});
