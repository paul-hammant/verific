# The Live Verify paper

Draft academic paper on the Live Verify protocol. The built PDF is published on the
site at [`/paper/live-verify-paper.pdf`](https://live-verify.github.io/paper/live-verify-paper.pdf)
(committed copy: [`public/paper/live-verify-paper.pdf`](../public/paper/live-verify-paper.pdf)).

## The rule that makes it a "paper from source code"

Evaluation numbers are **generated, never transcribed**. `make` runs
[`scripts/gen-conformance-table.js`](scripts/gen-conformance-table.js), which executes the
reference implementation (`public/normalize.js`) against the conformance corpus
(`normalization-hashes/`) and emits the LaTeX fragments in `generated/`. The generator
**fails the build** if any vector fails — the paper cannot compile over a broken corpus.
Files in `generated/` are committed (so the arXiv upload bundle is complete from a bare
checkout) but must never be hand-edited.

## Building

Requires `node` and [tectonic](https://tectonic-typesetting.github.io) (a single
self-contained binary — no TeX Live install needed):

```bash
make                                   # fragments → PDF → copy into ../public/paper/
TECTONIC=/path/to/tectonic make        # if tectonic isn't on PATH
```

Sections marked **[PLANNED]** (the OCR field-failure study, the confirmation-oracle
entropy analysis) are declared future work in the text itself — nothing in the paper
claims results that don't exist.

## Publication route

1. **Zenodo first** — no gatekeeper, instant DOI, CERN-backed archival. Upload the PDF
   plus a repo snapshot; the DOI and timestamp stand on their own.
2. **arXiv** (cs.CR primary) when an endorsement is arranged — first-time submitters in
   a category need an endorser. arXiv requires the **LaTeX source**, not just the PDF:
   upload `main.tex`, `refs.bib` (plus the generated `.bbl` from a local build),
   `generated/*.tex`, and any figures as one bundle. arXiv's compiler has no
   shell-escape, which is why `generated/` must be pre-built and committed.
3. Cross-reference the Zenodo DOI from the arXiv version and vice versa.
