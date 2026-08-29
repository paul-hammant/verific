# iOS App — TODO (OCR reading-order & truncation)

## Editing panel: offer common fixes / make hand-editing the pre-hash text easy

The editable "Normalized" pane already lets a human correct an OCR misread and re-verify. Two
improvements (cross-client — extension and Android too, not just iOS):

- **Offer common glyph fixes as one-tap suggestions.** OCR fails at *glyph confusion* — reads `é`→`e`,
  `a`→`o`, `rn`→`m`, `8`→`B`, `l`→`1`, `0`→`O`, drops a diacritic, etc. When a clean read still 404s, the
  panel could surface the likely confusable substitutions for the low-confidence characters ("did you
  mean `Beyoncé`?") as tappable fixes, rather than making the verifier hunt for the wrong character by
  hand. (NOTE: this is *re-reading assistance*, presenting candidate corrections to the human — it is
  NOT auto-guessing text variants and hashing each until one 200s. That "re-guess until it verifies" is
  the confirmation-oracle anti-pattern and must never be automated; see
  `docs/spoofing-countermeasures.md` and the enumeration limit in the README.)
- **At minimum, make hand-editing the pre-hash text frictionless** — good caret placement, monospace,
  visible whitespace/newlines, so the verifier can fix the exact bytes about to be hashed without
  fighting the editor.

## Retry-vs-terminal 404 signal (design)

A `404` currently reads the same whether it followed a *low-confidence* read (retry-able — "read it
better") or a *clean, confident* read (terminal — "the issuer does not stand behind this exact text;
this is the security-relevant negative"). Training users to retry past every `404` turns the security
signal into noise. Split it:

- **Low-confidence read → 404:** present as a *read failure* — "reposition / edit / re-verify" is the
  right response.
- **Clean, confirmed read → 404:** present as *terminal* — "not a document the issuer stands behind" —
  and **do NOT offer 'reposition and scan again'** there. Offering retry on a clean-read failure is the
  exact anti-pattern.

The app already has the inputs to make this split (OCR confidence per character; whether the human
edited the Normalized text). Optional: honest **auto-re-read** — capture again on a low-confidence
result, and if a cleaner read verifies, signal *"verified on 2nd read — corrected a low-confidence
`e`→`é`"* (caveat load-bearing, disclosed). Auto-re-READ (fresh honest OCR pass) is fine; auto-re-GUESS
(hashing text variants until one verifies) is forbidden — same reason as above.

Note: the *encoding* case (precomposed vs decomposed `é`) is already handled by NFC normalization in
`normalize.js` and is NOT an OCR failure — OCR outputs a character, not a Unicode form. These items are
about *glyph* confusion, which is a real OCR error class that improves as the on-device models improve.



Context: a mock e-ink credential failed to verify because OCR mis-assembled the lines, and a real claim
line ended up *after* the `verify:` line and was silently dropped from the hash. Full write-up (with
screenshots and the deterministic reproduction) is in the blog post
`public/blog/two-ocr-failures-on-one-eink-card.html`. These TODOs are the code follow-ups.

The OCR ABI in play is **classic Vision `VNRecognizeTextRequest`** (`Vision.framework`), with VisionKit
`DataScannerViewController` for the live-scan UI. `VNRecognizeTextRequest` returns **unordered**
`VNRecognizedTextObservation`s with bounding boxes — turning them into ordered lines is *our* job, not
Vision's. That assembly step is where the bug lives.

---

## 1. Fix the line-grouping algorithm (the root cause of the scramble) — DONE

Assembly now lives in one place: `LiveVerify/Pipeline/LineAssembler.swift`.

What changed:
- Observations are **sorted top-to-bottom first**, then swept into groups. A region can only join the
  group currently being built, so it can never chain-merge into a line further up the page, and the
  output no longer depends on the order Vision happened to return.
- Grouping compares against the group's **running mean centerY**, not its first-added member, so a
  line that drifts across a slightly rotated capture keeps grouping.
- The tolerance is a fraction (0.6) of the **median observation height for the whole capture**, not
  `max(heightA, heightB) * 0.5`. That was the actual defect: one tall, slanted bounding box widened
  the tolerance enough to swallow a physically separate line.
- Added a **horizontal-overlap guard** — regions that overlap in X by more than 20% of the narrower
  box cannot be on the same physical line, whatever their Y centres say. Text side by side on one
  line does not overlap; stacked lines do. This alone kills the observed `verify:… Roath Lock…` merge.

**Correction to the original note:** the second copy of this logic was *not* in `CameraService.swift`
— that file's `LiveTextDetector` only produces bounding boxes for the live viewfinder overlay and its
strings are never assembled or hashed. The real second copy was `Pipeline/TextRecognizer.swift` (the
shutter-capture path, whose text *is* hashed), which did no grouping at all: it sorted observations by
`boundingBox.origin.y` and emitted each as its own line. Both hashed paths now call `LineAssembler`.

Also in `LineAssembler`: re-joining a `verify:` URL that OCR split across several regions on one line.
It now closes up a space only at a URL join (the URL so far ends with URL punctuation, or the next
fragment starts with it) instead of stripping every space on the line — indiscriminate stripping would
weld a stranded claim onto the URL and hide the very mis-order item 3 exists to surface.

## 2. Add a regression test with synthetic scrambled observations — DONE

`LiveVerifyTests/LineAssemblerTests.swift` — no camera, no Vision, runs headless in the Simulator via
`xcodebuild test`. Covers: the scramble reproduction (Roath Lock alone on its own line and *before*
the verify line), order-independence, the horizontal-overlap guard, tight line spacing, a rotated
column, clean input unchanged, and the URL re-joining rules.

Note the y-values in the fixture are a *synthetic* reproduction of the observed output, not the real
run's measurements — the blog post preserves the OCR text, not the bounding boxes. They are chosen so
the old algorithm produces exactly the documented scramble and the new one does not.

## 3. Make post-`verify:` truncation LOUD — DONE

Decided with the product owner: **block, don't warn**. Text on or after the `verify:` line is an error
state — the human pressed Verify with the selection bounded so that `verify:` was the lowest line, so
nothing legitimate lives after it. Strict by design: **any** non-whitespace counts; no dust heuristic.

- `findStrandedText(rawText, urlLineIndex)` in `public/app-logic.js` (canonical, synced) finds content
  before *or* after the URL on the verify line, and any non-empty line below it.
- `VerificationOutcome.textAfterVerifyLine(String)` — nothing is hashed and no issuer is contacted.
  Previously this surfaced as a red "FAILED: Hash not found — by bbc.co.uk", blaming the issuer for
  our own truncation.
- The Normalized tab says plainly that nothing was hashed, shows the stranded content, and pre-fills
  the editor with every content line so the human can re-order and Re-verify.

## 4. Reconcile the three inconsistent Vision configurations — DONE

Decided with the product owner: **no spell-fixing**. The hashed paths are now explicitly `.accurate`
with `usesLanguageCorrection = false`:

| File | recognitionLevel | usesLanguageCorrection |
|---|---|---|
| `Pipeline/TextRecognizer.swift` (hashed) | `.accurate`, or `.fast` only if an issuer asks via `ocrHints` | `false`, explicit |
| `Camera/DataScanner.swift` (hashed) | `.accurate` | `false`, explicit |
| `Camera/CameraService.swift` (live overlay only, never hashed) | `.fast` | `false` |

Dictionary correction silently rewrites proper nouns and identifiers into plausible words, which
changes the hash — a guess dressed as a read. The editable Normalized pane remains the human fix for
genuine misreads.

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
- Still worth doing on a real device: confirm the tolerance constants in `LineAssembler` hold up on a
  genuinely angled e-ink capture. They are two named constants at the top of the file.
