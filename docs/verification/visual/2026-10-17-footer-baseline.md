# Desktop footer reference reconciliation

Only the 1440 px footer reference changes. The mobile reference, application code,
comparison thresholds, masks, timeouts and retry policy remain unchanged.

[Nightly 39054595961](https://github.com/gonzalomartinperez/pequeverso/actions/runs/39054595961)
tested develop `99df998cc9078ec4b8534543570cbaa0e50cb5af`: 11 visual cases passed;
the desktop footer failed both its original attempt and configured retry. The old
1440 × 740 reference says “PRODUCTO” and omits the affiliate course; the current
1440 × 741 capture says “PRODUCTOS” and includes “Guía de Alimentación para Bebés”.
The failed run and both original attempts are preserved as failures.

The desktop reference came from PR #91 (`5dd0312`). PR #102 (`902566d`) introduced
the plural product group and course link and updated the mobile footer reference.
No footer implementation or shared stylesheet changes in this release promotion.
Nightlies on the preceding `c6b46b0` revision passed, including run 39017808492;
the old reference had not previously failed that gate. The current Home also
changes the footer position. These observations establish an outdated reference
and a one-pixel capture-height difference, not a proven single rendering cause.

Two local comparisons of the exact disabled nightly export, Chromium on Linux,
Playwright 1.63.0, viewport 1440 × 900 and reduced motion reproduced the failure
without retries. Their actual images were identical to each other. Independent
geometry reads returned footer y=160.421875 and height=739.71875 CSS px. The local
and CI actual images have the same dimensions; only 25 pixels differ, each by a
maximum of one channel value. Both show complete, aligned, legible footer content.
The implementing agent and an independent coordinating agent inspected the
expected, actual and difference images; no human review is claimed.

The replacement is the exact CI actual image, SHA-256
`d66bd4a08488535aece64756a4ed4dd7c9a886ad94d9cf909b4be8747f905f7b`,
from artifact `visual-results` (12109415774), rather than a regenerated set.
Next.js 16.4.2 and React 19.3.1 match the evaluated revision. The exported
`build-info.json` identifies the revision above and `assistant: disabled`.

The unchanged focused comparison and repository checks must pass before
integration. The protected PR checks and a new full nightly on integrated develop
remain release gates; this reconciliation does not declare those future results.
No deployment, assistant activation or provider call is part of this change.

## Local verification of the replacement

`npm run check` passed: 196 unit tests, 14 structurally checked pages, all
budgets and the disabled-assistant guard across 126 text files. The unchanged
focused footer comparison passed twice against the exact nightly export, with one
worker and zero retries: two passes, no errors, skips or flaky cases, 12.993 s.
The local optional affiliate redirect variable was unset; this local check does
not claim to validate the production redirect. Full protected CI and the new
integrated nightly remain required.
