// Records the client chunk closure of the deferred 3D scene (src/motion/scene/scene-runtime.ts)
// in .next/scene-budget.json so scripts/check-scene-budget.ts can assert that the closure never
// enters the initial bundle and stays under its gzip budget. Chunk groups are followed
// (extracted vendors and nested async chunks included) instead of guessing minified filenames.
import { writeFileSync } from "node:fs";
import path from "node:path";

// Structural subset of the webpack 5 API this plugin reads. Next.js bundles webpack and types its
// `webpack` export as `any`, so the shapes are declared here (and satisfied by the unit test fakes).
type SceneModule = { identifier(): string; modules?: Iterable<SceneModule> };
type SceneChunkGroup = { chunks: Iterable<SceneChunk>; childrenIterable: Iterable<SceneChunkGroup> };
type SceneChunk = {
  files: Iterable<string>;
  groupsIterable: Iterable<SceneChunkGroup>;
  canBeInitial(): boolean;
};
type SceneCompilation = {
  chunks: Iterable<SceneChunk>;
  chunkGraph: { getChunkModulesIterable(chunk: SceneChunk): Iterable<SceneModule> };
};
/** The part of a webpack `Compiler` the plugin uses. */
export type SceneCompiler = {
  context: string;
  hooks: { done: { tap(name: string, fn: (stats: { compilation: SceneCompilation }) => void): void } };
};

export const SCENE_ENTRY = "src/motion/scene/scene-runtime.ts";
const SCENE_ENTRY_PATTERN = /[/\\]motion[/\\]scene[/\\]scene-runtime\.ts(?:[?|]|$)/;

function containsSceneEntry(module: SceneModule): boolean {
  if (SCENE_ENTRY_PATTERN.test(module.identifier())) return true;
  return module.modules ? [...module.modules].some(containsSceneEntry) : false;
}

/** Webpack plugin: writes `.next/scene-budget.json` ({ entry, roots, initial, files }) after a client build. */
export class SceneBudgetPlugin {
  apply(compiler: SceneCompiler): void {
    compiler.hooks.done.tap("SceneBudgetPlugin", ({ compilation }) => {
      const roots = [...compilation.chunks].filter((chunk) =>
        [...compilation.chunkGraph.getChunkModulesIterable(chunk)].some(containsSceneEntry),
      );
      const groups = new Set(roots.flatMap((chunk) => [...chunk.groupsIterable]));
      const chunks = new Set(roots);
      for (const group of groups) {
        for (const chunk of group.chunks) chunks.add(chunk);
        for (const child of group.childrenIterable) groups.add(child);
      }
      const files = [...new Set([...chunks].flatMap((chunk) => [...chunk.files]))]
        .filter((file) => file.endsWith(".js"))
        .sort();
      const report = {
        entry: SCENE_ENTRY,
        roots: roots.length,
        initial: [...chunks].some((chunk) => chunk.canBeInitial()),
        files,
      };
      writeFileSync(
        path.join(compiler.context, ".next", "scene-budget.json"),
        `${JSON.stringify(report, null, 2)}\n`,
      );
    });
  }
}
