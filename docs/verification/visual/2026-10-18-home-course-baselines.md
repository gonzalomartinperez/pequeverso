# Home course-copy visual references

The comparison at committed source `88d6d0add414261e5ccf5bd3e2b21285e1a33179`,
[run39162262140](https://github.com/gonzalomartinperez/pequeverso/actions/runs/39162262140),
failed Home at390/1440 and footer390; nine other visual cases passed. The course copy
now lists six modules and four bonuses, changing wrapping and vertical layout. Two agents
reviewed the complete actual captures, expected/diff images and detailed crops. The new
copy is readable and stays within its containers. No human review is claimed.

Footer390 keeps the same content and styles. Its1282.390625CSSpx height produces a1283px
capture instead of1284px, with minor rasterization and decorative bottom-edge differences.
The two actual footer captures are identical. This establishes the observed geometry;
it does not prove a single browser rendering cause.

The first Home390 capture additionally contains a transient mobile sticky chooser over
the hero, whereas the retry does not. The complete pixel difference between those two
actuals is confined to y710–909, the chooser overlay. Preserve this as a separate capture-state
defect, rather than classifying it as stars or accepting it into the reference. Capture
preparation now waits for real scrollY0 and the actual controller's hidden state. It does
not hide the bar or change production code, masks, thresholds, timeouts or retry policy.
The selected clean references remain capable of detecting that overlay.

Only three reviewed CI actual images replace their old references:

| Reference | CI attachment filename |
| --- | --- |
| Home390 | c4f85948321df47aef749806fcda60d4f969a6c0.png |
| Home1440 | 63e5c379836300996ac8e78427bb77f51a440c29.png |
| Footer390 | 9dd257c750cacd93844638f2f9a99f0063dc4e9c.png |

These names identify artifact attachments, not SHA256 checksums. Updating reviewed references
does not make the failed run green. A fresh complete comparison is required; regeneration
alone is not acceptance. All other reference PNGs retain their original bytes. Local focused
comparisons, repository checks, protected CI and an integrated full nightly remain pending
at this source freeze. No production activation or paid provider call is part of this change.


## First local complete comparison and subsequent capture preparation

Source `91257194e37c60ceead379b28530c71d0b39e1e7` passed the complete repository check
in88.791s (251unit tests,127default-OFF text files,14rendered pages). The12visual cases
ran with one worker and zero retries:11passed, while Home390 exceeded its existing30s
budget inside the original materialization evaluation, before reaching the new controller-state
assertions or screenshot. That failed run, trace and all outputs remain preserved.

The trace's last paint is partway through the feeding chapter. Fourteen observed media
requests returned200 in12–245ms; this does not establish that every lazy image was requested,
that the scroll walk finished, or that decoding caused the timeout. Subsequent capture-only
preparation records named walk/fonts/images/frame phases and image state by index, without
URLs or page content. It requests the same visible, non-inert images eagerly before decoding,
so offscreen lazy intersection is not a prerequisite for full-page reference materialization.
Decode failures remain failures with an image index. Production loading, masks, deadlines,
retry policy and content stay unchanged. Source review passes; a new complete runtime
comparison remains required and no single cause is claimed from the first timeout.
