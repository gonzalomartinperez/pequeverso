import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  assembleSite,
  type Entry,
  kindOf,
  requireStandaloneBuildInfo,
  selectStandaloneEntries,
} from "../../tools/ci/assemble-site.ts";
import { cleanEnv, runCli } from "./cli-process.ts";

const tool = new URL("../../tools/ci/assemble-site.ts", import.meta.url).pathname;
const entry = (name: string, kind: Entry["kind"]): Entry => ({ name, kind });
const standalone = [
  entry("server.js", "file"),
  entry("package.json", "file"),
  entry(".next", "dir"),
  entry("media", "dir"),
  entry("node_modules", "dir"),
];

/** A synthetic build: `.next/standalone`, `.next/static` and `public/` under a temp root. */
function writeBuild(root: string, output = "standalone"): void {
  const server = join(root, ".next/standalone");
  mkdirSync(join(server, ".next/server/app"), { recursive: true });
  mkdirSync(join(server, "media"), { recursive: true });
  mkdirSync(join(server, "node_modules/next"), { recursive: true });
  writeFileSync(join(server, "server.js"), "// server");
  writeFileSync(join(server, "package.json"), "{}");
  writeFileSync(join(server, ".next/BUILD_ID"), "id");
  writeFileSync(join(server, ".next/server/app/index.html"), "<p>home</p>");
  writeFileSync(join(server, "media/manifest.json"), "{}");
  writeFileSync(join(server, "node_modules/next/index.js"), "// never copied");
  mkdirSync(join(root, ".next/static/chunks"), { recursive: true });
  writeFileSync(join(root, ".next/static/chunks/a.js"), "// chunk");
  mkdirSync(join(root, "public/media"), { recursive: true });
  writeFileSync(join(root, "public/media/a.webp"), "webp");
  writeFileSync(join(root, "public/build-info.json"), JSON.stringify({ output }));
}

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "pv-assemble-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("kindOf distinguishes regular files and directories from links", () => {
  const stat = (file: boolean, dir: boolean, link: boolean) => ({
    isFile: () => file,
    isDirectory: () => dir,
    isSymbolicLink: () => link,
  });
  assert.equal(kindOf(stat(true, false, false)), "file");
  assert.equal(kindOf(stat(false, true, false)), "dir");
  assert.equal(kindOf(stat(false, false, true)), "symlink");
  assert.equal(kindOf(stat(false, false, false)), "other");
});

test("selectStandaloneEntries copies only the allowlist and skips node_modules", () => {
  assert.deepEqual(selectStandaloneEntries(standalone), [
    "server.js",
    "package.json",
    ".next",
    "media",
  ]);
  // media is optional; node_modules is skipped as a symlink too.
  const minimal = [
    entry("server.js", "file"),
    entry("package.json", "file"),
    entry(".next", "dir"),
    entry("node_modules", "symlink"),
  ];
  assert.deepEqual(selectStandaloneEntries(minimal), ["server.js", "package.json", ".next"]);
});

test("selectStandaloneEntries fails closed on unknown, mistyped or missing entries", () => {
  assert.throws(
    () => selectStandaloneEntries([...standalone, entry(".env", "file")]),
    /unexpected entry.*\.env/,
  );
  assert.throws(
    () => selectStandaloneEntries([...standalone, entry("secrets", "dir")]),
    /unexpected entry/,
  );
  assert.throws(
    () => selectStandaloneEntries([...standalone, entry("__proto__", "file")]),
    /unexpected entry/,
  );
  assert.throws(
    () =>
      selectStandaloneEntries(
        standalone.map((e) => (e.name === "media" ? entry("media", "symlink") : e)),
      ),
    /media.*regular dir/,
  );
  assert.throws(
    () =>
      selectStandaloneEntries(
        standalone.map((e) => (e.name === "server.js" ? entry("server.js", "symlink") : e)),
      ),
    /server\.js.*regular file/,
  );
  for (const required of ["server.js", "package.json", ".next"]) {
    assert.throws(
      () => selectStandaloneEntries(standalone.filter((e) => e.name !== required)),
      new RegExp(`missing: ${required.replace(".", "\\.")}`),
    );
  }
});

test("requireStandaloneBuildInfo accepts only a standalone identity", () => {
  requireStandaloneBuildInfo(JSON.stringify({ output: "standalone", sha: "x" }));
  assert.throws(
    () => requireStandaloneBuildInfo(JSON.stringify({ output: "export" })),
    /standalone/,
  );
  assert.throws(() => requireStandaloneBuildInfo("{}"), /standalone/);
  assert.throws(() => requireStandaloneBuildInfo("null"), /standalone/);
  assert.throws(() => requireStandaloneBuildInfo("not json"), /valid JSON/);
});

test("assembleSite builds the deployable tree without node_modules and refuses an existing target", () => {
  withRoot((root) => {
    writeBuild(root);
    const site = join(root, "site");
    assert.equal(assembleSite(root, site), 8);
    for (const [file, text] of [
      ["server.js", "// server"],
      ["package.json", "{}"],
      [".next/BUILD_ID", "id"],
      [".next/server/app/index.html", "<p>home</p>"],
      ["media/manifest.json", "{}"],
      [".next/static/chunks/a.js", "// chunk"],
      ["public/media/a.webp", "webp"],
    ] as const) {
      assert.equal(readFileSync(join(site, file), "utf8"), text, file);
    }
    assert.equal(existsSync(join(site, "node_modules")), false);
    assert.throws(() => assembleSite(root, site), /already exists/);
    symlinkSync(join(root, "nowhere"), join(root, "dangling"));
    assert.throws(() => assembleSite(root, join(root, "dangling")), /already exists/);
  });
});

test("assembleSite validates everything before creating the target", () => {
  const cases: [string, (root: string) => void, RegExp][] = [
    [
      "export identity",
      (root) => writeFileSync(join(root, "public/build-info.json"), '{"output":"export"}'),
      /standalone/,
    ],
    [
      "no build-info",
      (root) => rmSync(join(root, "public/build-info.json")),
      /ENOENT|no such file/i,
    ],
    [
      "no server",
      (root) => rmSync(join(root, ".next/standalone/server.js")),
      /missing: server\.js/,
    ],
    [
      "unknown entry",
      (root) => writeFileSync(join(root, ".next/standalone/.env"), "x"),
      /unexpected entry/,
    ],
    [
      "no static",
      (root) => rmSync(join(root, ".next/static"), { recursive: true }),
      /ENOENT|no such file/i,
    ],
    [
      "static already inside standalone",
      (root) => mkdirSync(join(root, ".next/standalone/.next/static")),
      /already contains/,
    ],
    [
      "symlink in standalone",
      (root) => symlinkSync(join(root, "public"), join(root, ".next/standalone/.next/server/link")),
      /only regular files and directories/,
    ],
    [
      "symlink in static",
      (root) => symlinkSync(join(root, "public"), join(root, ".next/static/link")),
      /only regular files and directories/,
    ],
    [
      "symlink in public",
      (root) => symlinkSync(join(root, "public/build-info.json"), join(root, "public/link.json")),
      /only regular files and directories/,
    ],
    [
      "symlinked public",
      (root) => {
        rmSync(join(root, "public"), { recursive: true });
        mkdirSync(join(root, "elsewhere"));
        writeFileSync(join(root, "elsewhere/build-info.json"), '{"output":"standalone"}');
        symlinkSync(join(root, "elsewhere"), join(root, "public"));
      },
      /public must be a regular directory/,
    ],
  ];
  for (const [label, mutate, message] of cases) {
    withRoot((root) => {
      writeBuild(root);
      mutate(root);
      assert.throws(() => assembleSite(root, join(root, "site")), message, label);
      assert.equal(existsSync(join(root, "site")), false, label);
    });
  }
});

test("assembleSite removes the partial target when copying fails", {
  skip: process.getuid?.() === 0 && "root reads unreadable files",
}, () => {
  withRoot((root) => {
    writeBuild(root);
    // Planning only reads metadata, so an unreadable file passes validation and fails mid-copy.
    const unreadable = join(root, "public/media/a.webp");
    chmodSync(unreadable, 0o000);
    try {
      assert.throws(() => assembleSite(root, join(root, "site")), /EACCES|permission/i);
    } finally {
      chmodSync(unreadable, 0o600);
    }
    assert.equal(existsSync(join(root, "site")), false);
    assert.equal(assembleSite(root, join(root, "site")), 8);
  });
});

test("assemble-site CLI defaults to site/ and reports failures", () => {
  withRoot((root) => {
    writeBuild(root);
    const done = runCli(tool, [], root, cleanEnv());
    assert.equal(done.status, 0, done.stderr);
    assert.equal(done.stdout, "assemble-site: 8 files into site/ (no node_modules)\n");
    assert.equal(readFileSync(join(root, "site/server.js"), "utf8"), "// server");
    const again = runCli(tool, [], root, cleanEnv());
    assert.equal(again.status, 1);
    assert.match(again.stderr, /assemble-site: .*already exists/);
    const named = runCli(tool, ["other"], root, cleanEnv());
    assert.equal(named.status, 0, named.stderr);
    assert.equal(existsSync(join(root, "other/public/build-info.json")), true);
  });
  withRoot((root) => {
    const result = runCli(tool, [], root, cleanEnv());
    assert.equal(result.status, 1);
    assert.match(result.stderr, /assemble-site:/);
    assert.equal(existsSync(join(root, "site")), false);
  });
});
