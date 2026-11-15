# Archived evidence: October 2026 screenshots

Roadmap M4-4 (`docs/master-plan/file-moves.md`, F-16): the 77 verification screenshots from
2026-10-10 to 2026-10-18 (assistant fixture captures and text-zoom captures) moved out of the tree
into the GitHub release
[`evidence-2026-10`](https://github.com/gonzalomartinperez/pequeverso/releases/tag/evidence-2026-10)
(immutable). The Markdown records that cite them stay here unchanged; their image paths resolve
inside the archive.

- Asset `verification-evidence-2026-10.zip` keeps every image at its repository path under
  `docs/verification/`. SHA-256 of the zip:
  `4eb58046b9f068371a7ac88b20bcac181f8fefc2ea49865f05cf187754728ddc`.
- [`ARCHIVE-2026-10.sha256`](ARCHIVE-2026-10.sha256) lists the SHA-256 of each image by path
  (identical to the release's `SHA256SUMS`). Check a download with
  `unzip verification-evidence-2026-10.zip && sha256sum -c docs/verification/ARCHIVE-2026-10.sha256`.
- The files are also in git history: `git show <commit>^:docs/verification/<path>` on the commit that
  removed them.

Evidence from the latest milestone (M3, 2026-11-14, for example `seo/`) stays in the tree.
