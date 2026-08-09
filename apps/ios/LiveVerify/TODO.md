# iOS App — TODO (OCR reading-order & truncation)

Context: a mock e-ink credential failed to verify because OCR mis-assembled the lines, and a real claim
line ended up *after* the `verify:` line and was silently dropped from the hash. Full write-up (with
screenshots and the deterministic reproduction) is in the blog post
`public/blog/two-ocr-failures-on-one-eink-card.html`. These TODOs are the code follow-ups.

The OCR ABI in play is **classic Vision `VNRecognizeTextRequest`** (`Vision.framework`), with VisionKit
`DataScannerViewController` for the live-scan UI. `VNRecognizeTextRequest` returns **unordered**
`VNRecognizedTextObservation`s with bounding boxes — turning them into ordered lines is *our* job, not
Vision's. That assembly step is where the bug lives.

---

## 1. Fix the line-grouping algorithm (the root cause of the scramble)

**File:** `LiveVerify/Camera/DataScanner.swift`, `recognizeText(in:)`, the "Group observations into
lines by Y overlap" block (~lines 256–271).

**Defect:** each observation's `centerY` is compared against the group's **first-added member**
(`lineGroups[i][0]`), with a `0.5 × height` threshold. On an angled / low-contrast capture where two
physically-separate lines have near-equal `centerY`, they get merged into one group and joined with a
space — e.g. producing `verify:bbc.co.uk/roles Roath Lock Studios access` on a single line. That single
mis-grouping is what strands a real claim line after the `verify:` URL.

**Fix direction (decide on-device with real observations):**
- Group by comparison against the group's **running mean centerY** (centroid), not against the first
  member, so a drifting/staggered column doesn't chain-merge.
- Reconsider the threshold: `0.5 × height` may be too loose for tight line spacing. Consider using the
  *median* observation height for the threshold, or a fraction of the *gap* between sorted y-centers.
- Sort groups top-to-bottom and within-group left-to-right (already done at ~272–276) — keep that, it's
  correct; the bug is upstream in grouping, not sorting.

**Note:** there are **two** copies of this OCR-to-lines logic —
`LiveVerify/Camera/DataScanner.swift` (the tapped-region path, `.accurate` + language correction) and
`LiveVerify/Camera/CameraService.swift` (the live path, `.fast`, no correction). Check whether
`CameraService` needs the same grouping and fix both, or factor the assembly into one shared helper so
they can't drift.

## 2. Add a regression test with synthetic scrambled observations

**File:** new case in `LiveVerifyTests/`.

Extract the observation-grouping logic into a testable function (input: an array of
`(text, centerX, centerY, height)`; output: `[String]` lines) and test it **without a camera** — this
runs headless in the Simulator via `xcodebuild test` on the Mac mini.

Cases to assert:
- The known scramble input (name / title / series / Wolf / verify / Roath-Lock with the staggered
  y-values from the real run) assembles into the correct 6 lines in reading order, with "Roath Lock"
  on its **own** line and *before* the verify line.
- Tight line spacing (small vertical gaps) does not chain-merge adjacent lines.
- A slightly rotated column (monotonic y-drift across a line) still groups correctly.
- Normal, clean top-to-bottom input is unchanged.

## 3. Make post-`verify:` truncation LOUD (belt-and-braces)

Even with grouping fixed, defend against any future mis-order: the pipeline currently hashes only the
lines **before** the `verify:` line (`extractCertText`) and silently discards anything on/after it as
"OCR garbage".

**Change:** if there is **claim-shaped text after the `verify:` URL on its line, or content lines below
the verify line**, do not silently drop it — surface a distinct, visible state, e.g. *"Text found
after the verify line — possible OCR mis-order. Check the Extracted tab."* This turns a silent
wrong-hash into an honest, legible failure (consistent with the project's fail-loudly rule — no
retry/fallback, just surface the condition).

Relevant logic is in the shared JS (`extractVerificationUrl` / `extractCertText` in
`public/app-logic.js`, bundled at `LiveVerify/Resources/JS/app-logic.js`) — coordinate any JS change
through `npm run sync-shared` so the extension and apps stay byte-identical. **Raise the exact
behaviour as a question before implementing** — this changes what the pipeline accepts/rejects.

## 4. Reconcile the three inconsistent Vision configurations

The three `VNRecognizeTextRequest` sites use different settings, so *which* errors appear depends on
which path ran:

| File | recognitionLevel | usesLanguageCorrection |
|---|---|---|
| `Camera/CameraService.swift` (~228–231) | `.fast` | `false` |
| `Camera/DataScanner.swift` (~300–301) | `.accurate` | `true` |
| `Pipeline/TextRecognizer.swift` (~106–116) | `.fast`/`.accurate` from meta hints | default |

Decide the intended config for the *verification* path (the one whose text gets hashed) and make it
deliberate and documented. The `.fast` + no-correction path is more prone to the `W`→`w` style misread;
if the hashed path should be `.accurate`, set it explicitly rather than inheriting a hint default.
(This is about *consistency and intent*, not adding correction that masks errors — the editable
Normalized pane remains the human fix for genuine misreads.)

## 5. (Optional) Evaluate the newer Swift Vision `RecognizeTextRequest`

iOS 18+ offers the Swift-native async `RecognizeTextRequest` replacing `VNRecognizeTextRequest`. It is
a cleaner ABI but has the **same** no-reading-order-guarantee — migrating alone does **not** fix the
scramble (items 1–2 do). Only consider this if there's an independent reason (async ergonomics, newer
model); note the min-iOS-version cost. Not a priority.

---

### Mac mini (2018, Intel) notes

- Items **1, 2, 3** are pure logic and run headless via `xcodebuild test` in the iOS Simulator — the
  mini is a good machine for these.
- The mini can **replay Vision on a saved image** (Vision runs on Intel macOS) to inspect raw
  observations/bounding boxes offline — useful for item 1. Caveat: the 2018 Intel mini has **no Neural
  Engine**, so its Vision output may differ from the iPhone's; a static saved image may OCR cleanly and
  *not* reproduce the live-capture scramble. Treat "can't reproduce on the mini" as *not* evidence the
  bug is gone — item 2's synthetic test is the reliable proof.
- Keep the iPhone only for occasional capture-realism spot-checks; the two real runs already in the
  blog post are sufficient evidence the bug is real.
