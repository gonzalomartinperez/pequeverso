---
name: write-adr
description: "Use when a decision changes structure, a contract, a dependency, a standard or a policy, or when asked to record a decision as an ADR, even if the change is small. Not for meeting notes, changelog entries or implementing the decision."
allowed-tools: Read, Grep, Glob, Edit, Write
metadata:
  owner: gonzalomartinperez
  last-reviewed: "2026-11-14"
  version: "1.0.0"
---

# Write an ADR

ADRs live in `docs/decisions/` as `ADR-NNNN-kebab-title.md`, numbered in sequence (latest:
`docs/decisions/ADR-0010-standalone-production-target.md`; copy its header and section layout).

## Checklist

- [ ] Next number: list `docs/decisions/`; never reuse a number.
- [ ] Header line: Date, Status (proposed | accepted | superseded), and Supersedes or Superseded by
  with a relative link when applicable.
- [ ] Sections in MADR 4 order: Context and problem, Decision (drivers, chosen option), Consequences,
  Alternatives considered, Confirmation (how compliance is checked: a test, a gate or a review step).
- [ ] Facts come from the repository or the owner decision register; cite the file. Never invent
  history, numbers or approvals.
- [ ] Superseding: add the link in both ADRs and update the old status line.
- [ ] Link the new ADR from the docs that own the behaviour (for example `docs/architecture.md`) and
  from `AGENTS.md` only if agents must follow it.
- [ ] Check that every relative link you wrote resolves.

## Verify, fix, re-verify

Open every link you wrote. Re-read the Confirmation section: if it names a test or gate, that command
must exist. Fix and re-check; stop after three failed attempts and report.

## Output template

```
ADR: <path under docs/decisions>   Status: <proposed|accepted>
Supersedes or related: <links>   Docs updated: <list>   Confirmation: <command or review step>
```

## Limits

- Not for meeting notes, changelog entries or making the change the ADR describes.
- An ADR records a decision someone made; it does not authorize one. Unaccepted decisions stay "proposed".
