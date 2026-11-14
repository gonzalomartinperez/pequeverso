import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runCli } from "./cli-process.ts";

const script = new URL("../../tools/lhci-assert.ts", import.meta.url).pathname;

test("Lighthouse CLI calibrates downloaded artifacts using final or requested URLs without editing baselines", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-lighthouse-cli-"));
  try {
    const ratchet = join(root, "ratchet.json");
    const original = JSON.stringify({
      values: [{ key: "/ lcp", value: 3, unit: "s", direction: "max" }],
    });
    writeFileSync(ratchet, original);
    writeFileSync(
      join(root, "manifest.json"),
      JSON.stringify([{ url: "https://example.invalid/", jsonPath: join(root, "absent.json") }]),
    );
    const audits = { "largest-contentful-paint": { numericValue: 1000 } };
    writeFileSync(
      join(root, "lhr-a.json"),
      JSON.stringify({ finalUrl: "https://example.invalid/", audits }),
    );
    writeFileSync(
      join(root, "lhr-b.json"),
      JSON.stringify({ requestedUrl: "https://example.invalid/", audits }),
    );
    writeFileSync(join(root, "lhr-ignored.json"), JSON.stringify({ audits }));
    writeFileSync(join(root, "ignored.json"), "not a report");
    writeFileSync(
      join(root, "config.json"),
      JSON.stringify({ ci: { collect: { numberOfRuns: 2 } } }),
    );
    const result = runCli(
      script,
      [ratchet, `--dir=${root}`, `--config=${join(root, "config.json")}`, "--suggest"],
      root,
    );
    assert.equal(result.status, 0, result.stderr);
    const proposal = JSON.parse(result.stdout);
    assert.equal(proposal.commit, "unknown");
    assert.match(proposal.source, /median of 2 runs with 10% headroom/);
    assert.deepEqual(proposal.values, [{ key: "/ lcp", value: 1.25, unit: "s", direction: "max" }]);
    assert.equal(readFileSync(ratchet, "utf8"), original);
    const unknownRuns = runCli(script, [ratchet, `--dir=${root}`, "--suggest"], root);
    assert.equal(unknownRuns.status, 0, unknownRuns.stderr);
    assert.match(JSON.parse(unknownRuns.stdout).source, /median of \? runs/);
    const config = join(root, "config.json");
    writeFileSync(config, JSON.stringify({ ci: { collect: { numberOfRuns: 0 } } }));
    const invalid = runCli(script, [ratchet, `--config=${config}`], root);
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /--runs must be a positive integer/);
    const usage = runCli(script, [], root);
    assert.equal(usage.status, 2);
    assert.match(usage.stderr, /Usage: node tools\/lhci-assert.ts/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
