# Native assistant · local preview, 2026-10-18

**Production remains disabled. This enabled fixture export must never be published.**
These are unedited PNG screenshots of the actual Pequeverso interface, with its existing
cream, navy and turquoise identity. The assistant is Spanish-only, with no language/theme
selector. The desktop opens compactly; expansion is an explicit visitor action.

| State | Original-resolution screenshot |
| --- | --- |
| Desktop launcher | [Sparkles button, accessible name, no visible AI label](01-Desktop-Boton.png) |
| Desktop welcome | [Welcome, suggested questions and composer](02-Desktop-Bienvenida.png) |
| Desktop conversation | [Fixture guarantee answer and expanded sources](03-Desktop-Conversacion.png) |
| Desktop waiting | [Actual held local HTTP request, thinking and cancellation control](04-Desktop-Espera.png) |
| Mobile welcome | [Suggested questions and input](05-Mobile-Bienvenida.png) |
| Mobile conversation | [Scrollable answer and fixed composer](06-Mobile-Conversacion.png) |
| Expanded desktop | [Additional product/source detail](07-Desktop-Conversacion-Ampliada.png) |

Store source: `755d541a86389703665e65c2b762aacfb6e345ad`.
Fixture producer revision: `2f22f24b30de7ee6a797d6397bef7422eb8e31cc`.
The [manifest](manifest.json) binds all seven files to their original hashes and source receipt.
The first four images are 1440 × 1000 image pixels; the mobile images are 1082 × 2202
image pixels. Image dimensions are not claims about CSS viewport dimensions.
Long product cards remain scrollable; the mobile view does not claim to show the whole card.

The isolated fixture build took 53.700 s; two native Chromium preview cases took 28.461 s,
with zero skips, retries or flakes. Build and tests used no provider credentials or paid calls.
All seven images were visually inspected by the implementing agent; an independent Ops agent
inspected the exact first six files. This is agent review, not human review. These screenshots
do not measure contrast, assistive technology, physical keyboards, VPS capacity, production
OAuth/cookies/SSE or real-model commercial correctness. Earlier galleries retain their own dates.

## Reproduce

Use isolated checkouts at the two exact revisions above, Node from `.nvmrc`, and the producer's
locked Python environment. Follow `docs/assistant.md` for the fixture environment, set
`ASSISTANT_API_DIR` to the isolated producer checkout, run `npm run build:assistant-fixture`,
then the native `tests/assistant/preview.spec.ts` through the assistant Playwright configuration.
The waiting case holds the real request before forwarding it to the local fixture API.
Capture only the isolated `out-assistant-fixture/` build; never publish its output or reuse its
configuration for a normal build. Review each PNG before replacing evidence. The expanded
image is supplementary, taken from the same actual native run.

See the [activation checklist](../../../assistant.md) and [verification history](../../assistant.md).
