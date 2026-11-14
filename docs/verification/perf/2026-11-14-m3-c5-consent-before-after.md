# M3-C5: production-config Lighthouse before and after prior opt-in consent

Lane: the CI "Performance checks" job, a production-config export with a fake pixel id and real third-party hosts (`*.facebook.com` blocked). Lighthouse mobile at 390×844, simulated throttling with 4× CPU, median of 3 runs per route. These are lab numbers, not field data. The live site changes only at M7.

| Route | Metric | Before (`develop`, 2026-11-14) | After |
|---|---|---|---|
| `/` | LCP | 0.81–1.13 s across 8 runs; 3 failed the 1.11 s gate | 0.29 s |
| `/` | third-party JS before consent | 100.5 KB | 0 KB |
| `/` | TBT | 0.00 s | 0.00 s |
| `/grafismo-fonetico/` | LCP | 1.03 s (run 43636871742) | 0.92 s |
| `/grafismo-fonetico/` | TBT | 0.00–0.02 s | 0.00 s |
| `/grafismo-fonetico/` | first-party JS transfer | 356.3 KB (run 43637557647) | 180.7 KB |

Runs and sources:
- Before: the `develop` push runs 43591571755 to 43622659715 and PR run 43636871742.
- After: PR #192 run 43637557647 (consent alone), PR #196 run 43639147960 (scene gate) and the `develop` push run 43642986761 (after #197).

The consent change (ADR-0011) removed the Meta Pixel from first visits, and that is what moved home LCP. The scene gate (ADR-0017) halved the product page's first-party script transfer. The audit baseline (live site, 2026-11-09: home 55, LCP 4.4 s; kit page 31, LCP 10.1 s) is a different, unthrottled-host measurement and is not comparable line by line.

`ratchets/lighthouse-lab.json` was re-seeded from run 43642986761 with `lhci-assert --suggest`, and every value only tightens.
