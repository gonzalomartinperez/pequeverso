# Skills

Ecosystem section 15 applies. Canonical skills live in `.agents/skills/<name>/SKILL.md`; the standard says each has a relative symlink `.claude/skills/<name>`. Since M1-7 this repo follows the standard: `.claude/skills/<name>` are relative symlinks to `../../.agents/skills/<name>`, validated by `tools/check-skills.ts` (WSL and Linux are the only authoring environments; CI runs Linux; if a Windows checkout ever matters, regular adapter files can return).

## 1. Audit of existing skills

| Skill | Lines | Purpose | Verdict | Target catalog name |
|---|---|---|---|---|
| `implement-feature` | about 40 | Build or change a page with the design system, content model, commerce rules | Good content, no evals, refers to `check` and browser tests | Renamed `implement-task` (core) and split: design-system part moves to `evolve-design-system`, copy part to `change-content`; the original text is preserved in the new skills (nothing deleted without landing) |
| `specify-feature` | 19 | Short spec before a page or section | Useful; repo-specific | Keep as `specify-feature` (extra) |
| `review-change` | 29 | PR review for commerce safety, accessibility, performance, hygiene | Good; lacks the independent-review chain and rubric | Keep name (core), add the rubric lens checklist, the "reproduce each finding" step and the evidence output template |
| `prepare-delivery` | 23 | Tagged release and gated deploy | Stale after the Hostinger main autodeploy and release-please | Rewritten as `verify-release` (core): release profile checks, changelog, `build-info.json` SHA, post-deploy verification, rollback via revert |
| `change-assistant` | 54 | Change the disabled assistant while keeping it compiled out | Good | Keep (extra); add the activation checklist link and the "never enable" guard |

All five have frontmatter with name and description only and no `evals/`. None has `metadata: {owner, last-reviewed, version}`.

## 2. Catalog mapping (ecosystem 15.5, web repos and sites)

| Skill | Core / type | Exists | Plan |
|---|---|---|---|
| `implement-task` | core | via `implement-feature` | rename and rewrite: roadmap item to PR through worktree, tests, review chain |
| `review-change` | core | yes | upgrade |
| `verify-release` | core | via `prepare-delivery` | rewrite |
| `update-dependencies` | core | no | new: handle the Monday PR (changelogs of `next`, `react`, `typescript`, `tailwindcss`, `zod`, `@playwright/test`, Base UI first; fix breakage on the same branch; keep CI green; never merge) |
| `write-adr` | core | no | new: MADR 4, index and two-way supersession links |
| `resume-refactor` | core | no | new: read `RESUME.md`, tracker and `progress.md`, continue the first unchecked item |
| `score-repo` | core | no | new: run the scorecard tool, compare ratchets, assemble the three-lens evidence pack |
| `audit-visual` | web | no | new: screenshots 320-1920, engines, states, banner, disabled assistant |
| `audit-accessibility` | web | no | new: axe plus keyboard plus reduced motion plus zoom; the Hotmart iframe exception protocol |
| `audit-performance` | web | no | new: Lighthouse on the production-config build and live, frame-time, LoAF, third-party-before-consent check |
| `evolve-design-system` | web | partly in `implement-feature` | new: change DTCG tokens or primitives with contrast checks and visual baselines |
| `change-content` | sites | partly | new: copy and facts from config only; tú rules; no invented claims; invariants test; owner approval list (PV-D7) |
| `animate-scene` | portfolio, pequeverso | no | new: the 3D starfield within budgets: desktop-only mount rule, reduced motion, static fallback, `check:scene` |
| `measure-conversion` (extra) | pequeverso | no | new: event taxonomy change, consent class, schema and test; never emits `InitiateCheckout` or `Purchase` |
| `specify-feature`, `change-assistant` | extra | yes | keep |

Format rules (ecosystem 15.5): description starts "Use when ..." and states "Not for ..."; body at most 120 lines; checklist, exact commands, output template, verify then fix then re-verify loop; references one level deep; allowed tools listed; `metadata: {owner, last-reviewed, version}`; no secrets or network calls.

## 3. Activation eval bank

Each skill has `evals/triggers.json` (about 20 queries: 8-10 positive and 8-10 near-miss negatives, fixed 60/40 train/validation split) and `evals/evals.json` (2-3 output evals with assertions, run with and without the skill). Protocol: 3 runs per query on a clean context; positive passes at 0.5 or more, negative below 0.5; report precision and recall on validation only. Gate in the `harness` profile: a skill change does not merge if validation trigger accuracy drops by more than 10 points or the output delta turns negative. Rot control: `last-reviewed` older than 180 days opens an issue; hard rules go to hooks or `permissions.deny`.

Near-miss pairs specific to this repo (examples for the bank): "change the price" (negative for `implement-task`, positive for `change-content`, with the invariant that the value lives in config); "add a testimonial" (negative everywhere: the skill must refuse and point to the proof rules); "turn on the assistant" (negative for `change-assistant`: owner decision PV-D12); "add the Meta pixel to a new page" (negative for `measure-conversion` unless a consent class is named); "make the buy button green" (negative: coral is the purchase colour; `evolve-design-system` explains the rule).

## 4. Harness additions

`AGENTS.md` shrinks to the standard layout: commands, non-obvious layout, deviations, boundaries, skills list, docs map (the Next.js agent-rules block stays; it is re-added by `next dev`). `CLAUDE.md` stays `@AGENTS.md` plus Claude-only notes. `.codex/config.toml` (on-request, workspace-write, no network, no secrets) and `.worktreeinclude` (without `.env`) follow `research/14-codex-harness.md` (not copied: unchanged shared note). Hooks and permissions block the destructive patterns listed in the owner's global rules; the repo adds a `PreToolUse` guard that refuses edits to `config/commerce.ts`, `content/es/legal/**` and `contracts/**` without the task naming them (the existing CODEOWNERS entries already mark them).
