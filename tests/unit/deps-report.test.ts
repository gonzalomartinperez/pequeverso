import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildReport,
  checkLicences,
  createFetchJson,
  type FetchJson,
  parseArgs,
  parseScorecard,
  parseVersion,
  renderJson,
  renderMarkdown,
  run,
  summariseAudit,
} from "../../tools/deps-report.ts";

const script = fileURLToPath(new URL("../../tools/deps-report.ts", import.meta.url));
const V = "https://api.deps.dev/v3/systems/npm/packages";
const P = "https://api.deps.dev/v3/projects";

const manifest = {
  dependencies: { zod: "^4", "@scope/pkg": "^1" },
  devDependencies: { beta: "^1", alpha: "^1", ghost: "^1" },
};
const lock = {
  packages: {
    "node_modules/zod": { version: "4.0.0" },
    "node_modules/@scope/pkg": { version: "1.0.0" },
    "node_modules/alpha": { version: "2.0.0" },
    "node_modules/beta": { version: "3.0.0" },
  },
};

const version = (licenses: unknown, advisories: unknown, project?: string): unknown => ({
  licenses,
  advisoryKeys: advisories,
  relatedProjects: project
    ? [
        { relationType: "ISSUE_TRACKER", projectKey: { id: "x/issues" } },
        { relationType: "SOURCE_REPO", projectKey: { id: project } },
      ]
    : [],
});

function fake(map: Record<string, unknown>, calls: string[] = []): FetchJson {
  return async (url) => {
    calls.push(url);
    return map[url];
  };
}

test("builds sorted runtime then dev rows with all fields", async () => {
  const calls: string[] = [];
  const rows = await buildReport(
    manifest,
    lock,
    fake(
      {
        [`${V}/zod/versions/4.0.0`]: version(
          ["MIT"],
          [{ id: "GHSA-1" }, { id: "GHSA-2" }],
          "github.com/colinhacks/zod",
        ),
        [`${P}/github.com%2Fcolinhacks%2Fzod`]: { scorecard: { overallScore: 8.5 } },
        [`${V}/%40scope%2Fpkg/versions/1.0.0`]: version(["LGPL-3.0-or-later"], []),
        [`${V}/alpha/versions/2.0.0`]: version(["GPL-3.0"], [], "github.com/a/a"),
        [`${P}/github.com%2Fa%2Fa`]: { scorecard: {} },
        [`${V}/beta/versions/3.0.0`]: version([], undefined),
      },
      calls,
    ),
    { vulnerabilities: { zod: { severity: "high", via: [{ source: 1 }, "dep"] } } },
  );
  assert.deepEqual(
    rows.map((r) => [r.name, r.kind, r.version, r.licenceCheck]),
    [
      ["@scope/pkg", "runtime", "1.0.0", "allowed (unmodified dynamic use, OD-80)"],
      ["zod", "runtime", "4.0.0", "ok"],
      ["alpha", "dev", "2.0.0", "review"],
      ["beta", "dev", "3.0.0", "unknown"],
      ["ghost", "dev", "unknown", "unknown"],
    ],
  );
  const zod = rows[1];
  assert.equal(zod?.scorecard, 8.5);
  assert.equal(zod?.advisories, 2);
  assert.equal(zod?.audit, "1 high");
  assert.equal(rows[2]?.scorecard, null);
  assert.equal(rows[3]?.advisories, null);
  assert.equal(rows[0]?.audit, "none");
  assert.ok(!calls.some((url) => url.includes("ghost")));
});

test("works without audit and with empty manifest sections", async () => {
  const rows = await buildReport({}, {}, fake({}));
  assert.deepEqual(rows, []);
  const [row] = await buildReport({ dependencies: { a: "1" } }, {}, fake({}));
  assert.equal(row?.audit, "n/a");
  assert.equal(row?.version, "unknown");
});

test("limits concurrency to 4", async () => {
  let active = 0;
  let peak = 0;
  const deps = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`p${i}`, "1"]));
  const packages = Object.fromEntries(
    Object.keys(deps).map((n) => [`node_modules/${n}`, { version: "1.0.0" }]),
  );
  await buildReport({ dependencies: deps }, { packages }, async () => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 2));
    active -= 1;
    return null;
  });
  assert.equal(peak, 4);
});

test("checkLicences covers allow-list, LGPL, review and unknown", () => {
  assert.equal(checkLicences([]), "unknown");
  assert.equal(checkLicences(["MIT", "ISC"]), "ok");
  assert.equal(checkLicences(["BlueOak-1.0.0"]), "ok");
  assert.equal(
    checkLicences(["MIT", "LGPL-3.0-or-later"]),
    "allowed (unmodified dynamic use, OD-80)",
  );
  assert.equal(checkLicences(["MIT", "GPL-3.0"]), "review");
});

test("parseVersion is defensive", () => {
  assert.deepEqual(parseVersion(null), { licences: [], advisories: null, projectId: null });
  assert.deepEqual(parseVersion([]), { licences: [], advisories: null, projectId: null });
  assert.deepEqual(parseVersion({ licenses: "MIT", advisoryKeys: {}, relatedProjects: "x" }), {
    licences: [],
    advisories: null,
    projectId: null,
  });
  assert.deepEqual(
    parseVersion({
      licenses: ["MIT", 3],
      advisoryKeys: [{ id: "a" }, { id: 1 }, null],
      relatedProjects: [
        null,
        { relationType: "SOURCE_REPO", projectKey: "bad" },
        { relationType: "SOURCE_REPO", projectKey: { id: 5 } },
        { relationType: "SOURCE_REPO", projectKey: { id: "gh/x" } },
      ],
    }),
    { licences: ["MIT"], advisories: 1, projectId: "gh/x" },
  );
});

test("parseScorecard handles missing and malformed data", () => {
  assert.equal(parseScorecard(undefined), null);
  assert.equal(parseScorecard({}), null);
  assert.equal(parseScorecard({ scorecard: { overallScore: "9" } }), null);
  assert.equal(parseScorecard({ scorecard: { overallScore: Number.NaN } }), null);
  assert.equal(parseScorecard({ scorecard: { overallScore: 7.1 } }), 7.1);
});

test("summariseAudit counts per package by severity", () => {
  assert.equal(summariseAudit(undefined, "a"), "n/a");
  assert.equal(summariseAudit("junk", "a"), "none");
  assert.equal(summariseAudit({ vulnerabilities: "x" }, "a"), "none");
  assert.equal(summariseAudit({ vulnerabilities: { a: { severity: 3 } } }, "a"), "none");
  assert.equal(summariseAudit({ vulnerabilities: { a: { severity: "low" } } }, "a"), "1 low");
  assert.equal(
    summariseAudit({ vulnerabilities: { a: { severity: "critical", via: [{}, {}, "b"] } } }, "a"),
    "2 critical",
  );
});

test("renderers", () => {
  const rows = [
    {
      name: "a|b",
      kind: "runtime" as const,
      version: "1.0.0",
      licences: ["MIT", "ISC"],
      licenceCheck: "ok" as const,
      scorecard: 7,
      advisories: 0,
      audit: "none",
    },
    {
      name: "c",
      kind: "dev" as const,
      version: "unknown",
      licences: [],
      licenceCheck: "unknown" as const,
      scorecard: null,
      advisories: null,
      audit: "n/a",
    },
  ];
  const lines = renderMarkdown(rows).split("\n");
  assert.equal(
    lines[0],
    "| Package | Kind (runtime/dev) | Version | Licence | Licence check | Scorecard | Advisories (deps.dev) | npm audit |",
  );
  assert.equal(lines[1], "|---|---|---|---|---|---|---|---|");
  assert.equal(lines[2], "| `a\\|b` | runtime | 1.0.0 | MIT, ISC | ok | 7 | 0 | none |");
  assert.equal(lines[3], "| `c` | dev | unknown | unknown | unknown | unknown | unknown | n/a |");
  assert.deepEqual(JSON.parse(renderJson(rows)), rows);
});

test("parseArgs", () => {
  assert.deepEqual(parseArgs([]), { root: ".", audit: null, json: false });
  assert.deepEqual(parseArgs(["--root", "r", "--audit", "a.json", "--json"]), {
    root: "r",
    audit: "a.json",
    json: true,
  });
  assert.throws(() => parseArgs(["--root"]), /needs a value/);
  assert.throws(() => parseArgs(["--audit", "--json"]), /needs a value/);
  assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
});

test("createFetchJson: ok, 404, retry once, failure", async () => {
  const json = (status: number, body: unknown = {}) =>
    ({ ok: status < 400, status, json: async () => body }) as Response;
  assert.deepEqual(await createFetchJson((async () => json(200, { a: 1 })) as typeof fetch)("u"), {
    a: 1,
  });
  assert.equal(await createFetchJson((async () => json(404)) as typeof fetch)("u"), null);
  let n = 0;
  const flaky = (async (_u: string, init?: RequestInit) => {
    assert.ok(init?.signal);
    n += 1;
    if (n === 1) throw new Error("boom");
    return json(200, { ok: true });
  }) as typeof fetch;
  assert.deepEqual(await createFetchJson(flaky)("u"), { ok: true });
  let m = 0;
  const bad = (async () => {
    m += 1;
    return json(500);
  }) as typeof fetch;
  await assert.rejects(createFetchJson(bad)("http://x"), /request failed for http:\/\/x: HTTP 500/);
  assert.equal(m, 2);
  const str = (async () => {
    throw "nope";
  }) as typeof fetch;
  await assert.rejects(createFetchJson(str)("u"), /nope/);
});

test("run and CLI read files and report invalid input", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "deps-report-"));
  try {
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { zod: "1" } }));
    writeFileSync(
      path.join(dir, "package-lock.json"),
      JSON.stringify({ packages: { "node_modules/zod": { version: "4.0.0" } } }),
    );
    writeFileSync(
      path.join(dir, "audit.json"),
      JSON.stringify({ vulnerabilities: { zod: { severity: "moderate" } } }),
    );
    const f = fake({ [`${V}/zod/versions/4.0.0`]: version(["MIT"], []) });
    const md = await run(["--root", dir, "--audit", path.join(dir, "audit.json")], f);
    assert.match(
      md,
      /\| `zod` \| runtime \| 4\.0\.0 \| MIT \| ok \| unknown \| 0 \| 1 moderate \|/,
    );
    const js = JSON.parse(await run(["--root", dir, "--json"], f)) as unknown[];
    assert.equal(js.length, 1);

    writeFileSync(path.join(dir, "package.json"), "[]");
    await assert.rejects(run(["--root", dir], f), /must be objects/);
    writeFileSync(path.join(dir, "package.json"), "{bad");
    await assert.rejects(run(["--root", dir], f), /cannot read/);

    const cli = spawnSync(process.execPath, [script, "--root", dir], { encoding: "utf8" });
    assert.equal(cli.status, 1);
    assert.match(cli.stderr, /deps-report: cannot read/);
    const empty = spawnSync(process.execPath, [script, "--bogus"], { encoding: "utf8" });
    assert.equal(empty.status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
