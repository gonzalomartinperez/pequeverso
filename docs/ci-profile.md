# CI profile

This is validation, not deployment authority. The website remains on Hostinger Business and its
publishable assistant stays disabled. Existing Deploy, post-deploy verification, Production daily
and Branch policy workflows are unchanged. Main publication remains the owner's separate release.

## Core CI

PRs, pushes to `develop`/`main` and manual dispatch run the same gates. Independent workflow and
secret validation can fail early. Quality contains lint, root/Node/media types, unit/architecture
negative fixtures, production/full knip, skills and the production dependency audit.

| Job role | Depends on | Required behavior |
|---|---|---|
| Workflow validation | none | actionlint + zizmor, all workflows/actions |
| Secret scan | none | redacted full-history scanner, fail on incomplete history |
| Quality checks | none | static/unit/dependency checks, no production credentials |
| Build | quality | default-OFF export, tree cleanliness, media/scene/bundle/render checks |
| Hosting contract | quality | pinned Rocky 8, GLIBC 2.28, WASM SWC, standalone startup/smoke |
| Browser tests (1–8) | build | functional shards 1–4; native shards 1–4; fail-fast false |
| Performance checks | build | existing two-run/four-route Lighthouse checks, unchanged thresholds |
| Required checks | all seven roles | every exact prerequisite must be `success` |

The existing required status `ci` is a temporary compatibility job after all eight roles. It
requires all of them to succeed under `always()`: missing, failed, cancelled, pending or skipped
results fail closed. No protection is removed, renamed in settings or bypassed by this source
change. Branch policy stays independently required. New human-facing status names do not collide
with Nightly names. Only superseded PR CI is cancelled; pushes and Nightly are not cancelled.

### Browser identity coverage

`playwright.config.ts` (`PW_SET=pr`) retains Firefox 390, WebKit 390, Chromium 1440/768/390 and
reduced motion. `playwright.assistant.config.ts` retains Chromium desktop/mobile/reduced motion,
Firefox desktop and WebKit desktop/mobile. These are two configurations, not twelve projects in
one configuration. Each has four shards; `max-parallel: 4` bounds simultaneous legs. No speedup
is inferred.

Before execution, each runner discovers the full configuration and every shard using Playwright
`--list --reporter=json`. `tools/ci/inventories.ts` requires the full project catalogue and a
nonempty, duplicate-free, disjoint exact union of identities including configuration, project,
source file/line/column, nested titles, spec ID and repeat index. Parameter titles/IDs remain
separate. This proves selection coverage only; the following real browser command must also
succeed. JSON/HTML results, inventory receipts and execution logs remain per-leg evidence.

Native legs check out the committed public API revision, install its frozen lockfile, rebuild
the enabled fixture at the current source and run HTTPS loopback/fixture mode with no key or
paid calls. Fixed fixture ports 3217/8217 are isolated by runner. The enabled export, API checkout,
SQLite data and throwaway TLS private keys are never uploaded. Identity receipts are not artifacts
suitable for publication. Reports may contain synthetic browser traces; never run with live data.

## OFF export transfer

Only `out/` with disabled build identity is transferable. `tools/ci/artifacts.ts` stages a payload
directory and a closed manifest: no tar extraction or base64 container. The producer publishes
its manifest checksum as a job output. Pinned same-run upload/download actions transport the
staging directory; their success alone does not establish integrity.

Every consumer verifies the producer's repository, candidate/workflow SHA, run/attempt, selected
public build configuration and committed Next/edge configuration hashes, lockfile hash and build
identity. The complete regular-file set, size and SHA256 of every member must match. Unknown
fields/files, absolute/traversal/backslash paths, duplicate/prefix-conflicting members, linked
files/directories, hardlinks, devices/FIFOs, sensitive-file extensions, enabled markers and
missing required files fail closed before creating `out/`. Only selected public configuration values and committed configuration/lock bytes enter these hashes;
raw environment values and provider credentials are not serialized.

Limits are 4,096 files, 8 MiB per file and 64 MiB expanded payload; depth/directory count are
bounded too. This conservative envelope allows room above the committed 25 MiB media budget;
it is an assumption, not a measurement of the current export or a performance improvement claim.
The first full build must prove it fits. Producer and consumer may leave partial **job-local**
staging/output after an interruption or concurrent file change; their failed step blocks any
consumer success. A fresh isolated runner is the recovery path. This is not a deployment package,
backup format, cryptographic attestation or defense against a malicious PR controlling its own
workflow; checks execute untrusted PR code without production secrets or writer permissions.

## Nightly

Seven roles: prepare → quality → browser/visual/links/bundle → Nightly required checks. Prepare
freezes the checkout identity. Quality retains full knip, the no-integration default-OFF build,
bundle checks, golden edge comparison and actual clean-clone consent/commerce assertions with
no pixel ID. The verified OFF export feeds the remaining jobs.

Browser preserves all seven widths on Chromium and WebKit in eight shards of the full 14-project
configuration, with `max-parallel: 4` and fail-fast false. Every runner discovers the full catalogue
and all eight shard inventories; the verifier requires their disjoint exact identity union. Visual
compares the existing snapshots by default. Links checks the
export. Bundle retains **20 Lighthouse samples** (five × four routes), the same assertions and
bundle analysis. Analysis performs its own instrumented same-source build; it does not reuse
the identical runtime binary. Its fresh public build-info is generated before analysis, the rebuilt
export must pass the disabled-assistant guard, and a separate source/run/config/file-set manifest
is recorded afterward. Only that analyzer manifest and reports are uploaded; its payload is not
uploaded or authorized for deployment. The 20 Lighthouse samples still use the verified downloaded
OFF export, before this separate analyzer rebuild. No threshold, retry, timeout, baseline or
assertion is relaxed.

Scheduled runs use the repository default branch (`develop` at this source); manual dispatch uses
the selected ref. The existing `update_snapshots` boolean stays manual and false by default.
Explicit regeneration uploads its results but is labelled **not baseline-comparison acceptance**
in both visual and aggregate summaries. A later normal comparison run remains necessary.
Production daily and its live availability/checkout probes remain separate and unchanged.

## Local evidence and activation

Dependency-free policy tests:

```sh
node --test tests/unit/ci-policy.test.ts tests/unit/dependabot-manual.test.ts
```

They cover decisions and unsafe synthetic inputs; they do not execute Next, Playwright, upstream
application scripts or production.
`dependency-policy.yml` is advisory and read-only; every dependency PR still needs manual review.

Source-only review cannot certify workflow/action lint, TypeScript/full knip, real discovery or
browser/build success. Hosted required checks, full Nightly with regeneration false and the
owner's release decision remain prerequisites. No speedup percentage or complete parity is
claimed before those runs. To pause this transition, revert through a normal PR; do not disable
checks or retire the `ci` compatibility status without an explicit settings decision.
