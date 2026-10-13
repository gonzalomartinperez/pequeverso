# Landing desktop baseline reconciliation

The 1440 px landing reference predates the reviewed Includes counter alignment, shared
syllable shuffle and larger GA·TO portrait. Only that reference changes here. The other
11 screenshot files remain byte-identical; no application code, snapshot threshold,
mask, screenshot timeout or retry policy changes.

## Evidence

[Nightly 38332837744](https://github.com/gonzalomartinperez/pequeverso/actions/runs/38332837744)
ran the integrated revision `e98857c835b921a37725397f3c24f2c0cb19ac02` with public defaults,
no Meta Pixel identifier, and the assistant disabled. Its original visual report has
12 cases: 11 passed and one unexpected failure, with no skips or flaky cases. The
landing desktop case failed both original attempts (retry indices 0 and 1), giving
13 attempts in total. This failed run remains the historical result.

The failed comparison expected 1440 × 15014 px and received 1440 × 14942 px;
1,259,742 pixels differed (reported ratio 0.06). The replacement is the exact actual
image attached to that failed comparison, reviewed individually by the implementing
agent and independently by the coordinating agent. No human review is claimed.

A separate private Chromium diagnostic measured the same disabled nightly export.
Applying only the former grid ratio and portrait aspect through temporary CSSOM
changed the page height from 14942 to 15014 px. Restoring the current styles returned
it to 14942 px. The playground's left/card height changed from 1030.3125 to
1102.3125 px and back; its width changed from 735 to 828.15625 px and back. The
portrait became wider and taller while the left content became 72 px shorter.
Text stayed identical, and document width stayed equal to the 1440 px viewport.
The diagnostic image shows only the restored current design, with both faces and
GA·TO cards visible. Temporary former styles are not presented as a historical photo.

The measured 72 px shift explains the page-height difference and displaced sections;
the complete pixel difference also includes minor image-loading variations. It is
not attributed entirely to the merchant adjustments. An initial diagnostic capturer
waited for hidden lazy images and timed out after 90 seconds; its failed evidence
is preserved separately. The corrected harness saved measurements before decoding
only the visible portrait and completed in 15.334 seconds. No application test
limit was changed.

An earlier four-case local preflight used a CI export with a simulated Meta Pixel
and therefore a visible consent banner. It is retained as configuration-confounded
evidence, not used to generate this reference. The real nightly also passed its
clean-clone no-banner/no-cookie check.

## Exact reference

- File: `tests/e2e/__screenshots__/visual-chromium-1440/visual.spec.ts/landing.png`
- SHA-256: `9ca7820478db5bff345a64e7a0c57e94a9402b565413bf07b2cdac9644c0a74b`
- Producer artifact: `visual-results`, ID 11783900905, from the run above.
- Publication state: assistant disabled; no deployment or provider call in this work.

The replacement must pass the unchanged affected comparison and the repository
checks before integration. A final nightly after integration supplies the complete
12-reference comparison; this document does not claim that future run has passed.

## Local checks on the replacement

`npm run check` passed in 213.985 seconds: 170 unit tests, disabled-assistant guard
across 127 text files, and structural checks on 14 exported pages. The separately
executed affected comparison used the same nightly export and unchanged 20-second
screenshot assertion with zero retries. It failed at the screenshot deadline without
returning an actual image or pixel comparison (58.635 seconds test-report duration,
65.589 seconds process duration). The raw report and trace are retained. This is not
claimed as a passing affected comparison or attributed to host load. Full remote
checks and the post-integration nightly remain required.
