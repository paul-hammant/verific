---
layout: post
title: "Three OCR Failures on One e-Ink Card — and Why Showing Your Working Beats Hiding It"
date: 2026-08-09
---

*Published version (with screenshots) lives at `public/blog/two-ocr-failures-on-one-eink-card.html`.
This is the Markdown source of record.*

I made a cheap prop credential, pointed the Live Verify iOS app at it, and it failed to verify — three
separate times, for three genuinely different reasons. Two were bugs in our own code, and they're now
fixed. One is a lesson about how you print a credential in the first place. None of them was solved by
letting the app quietly "correct" what it read until something passed — and that restraint is the whole
point of this post.

## The card

A mock BBC role-access pass:

```
Paul James Hammant
16th Doctor Who
Series 16 (2027)
Roath Lock Studios access
Wolf Studios access
verify:bbc.co.uk/roles
```

To be clear: `bbc.co.uk/roles` is **fiction**, a showcase prop — there is no such endpoint.

The display is a [Vidabay](https://vidabay.net) e-ink panel, **about $30** — cheap, low-power,
reflective. That's the kind of surface a real "smart credential" might use, and it's a genuinely
*harder* capture than laser print: low contrast, tinted background, matte reflective finish that throws
glare. ($30 is today's price and will fall. This panel is also small, and too slow to re-write over an
NFC tap to feel smooth — honest limits as of this card, not dead ends.)

## Why one wrong character is fatal

Live Verify hashes the *exact* text of a claim and asks the issuer's domain whether that hash is one it
stands behind. SHA-256 is deliberately brittle: change one byte and the output is a completely
different hash. That brittleness is the point — it's what makes tampering detectable — but it cuts both
ways. If the text the app hashes differs from the registered text by even one character, the lookup
fails. Not "close." Failed. All three failures below are the same thing — the bytes the app hashed
weren't the bytes the issuer hashed — differing only in *why*.

## Failure one: Apple's OCR read "Wolf" as "wolf"

The **Extracted** tab shows exactly what Vision pulled off the image. In an early run the fifth line
came back `wolf Studios access`. The card says **"Wolf"**. `W` (0x57) and `w` (0x77) are different
bytes, so the hash is wrong. This isn't Apple being bad — **case is genuinely ambiguous at small
sizes** for letters whose forms differ only in scale (c/C, o/O, s/S, w/W, x/X). Real, understood, and
**human-recoverable** in the editable Normalized pane.

## Failure two: a claim line got dropped before the hash

In another run the **Normalized** tab showed only three lines; both studio-access lines were gone. The
app hashed a *shorter* credential than the one on the display. A three-part collision:

1. **The card word-wrapped a line I didn't want wrapped.** The panel firmware wraps long lines; every
   wrap is a chance for what follows to be mis-ordered.
2. **Apple's OCR scrambled the reading order.** Vision returns *unordered* text regions with bounding
   boxes; ordering them is the app's job. It returned "Roath Lock Studios access" *after* the `verify:`
   line, merged onto it.
3. **The pipeline assumed everything after `verify:` was garbage.** It hashed only the lines before the
   URL, so the stranded claim line was silently truncated. Four lines hashed, not five — a red "FAILED:
   Hash not found — by bbc.co.uk" that blamed the issuer for our own mistake.

**Fixed, and shipped.** Line assembly now lives in one place (`LineAssembler.swift`), shared by every
hashed path. Regions are sorted top-to-bottom first and grouped against a running centre-line, with a
**horizontal-overlap guard**: two regions overlapping side-to-side can't be on the same physical line,
whatever their vertical positions say. That alone kills the merge. Post-`verify:` truncation is now a
**loud, distinct error** — stranded text means the app hashes nothing, contacts no issuer, and says so,
instead of blaming the domain. A headless test feeds the exact scramble and asserts correct reassembly.

## Failure three: a superscript "th" became a quote mark

With reading order fixed, the same card produced a cleaner failure — and it's nobody's *code* bug. The
card says **16ᵗʰ Doctor Who** with a typographic *superscript* "th". Apple's OCR read that raised "th"
as a **double-quote mark**: `16" Doctor Who`. Different bytes, wrong hash — but reading order and
truncation are both correct now, so it's a clean single-glyph miss. Three things stacked:

- **The card was authored with a superscript ordinal** — the smallest, highest-detail glyph on the
  card, first to break.
- **The card was small in the viewfinder** — the unglamorous reason: an impromptu test, the card
  tethered to a temperamental 2018 Mac mini by a 6-inch USB cable, and that nest of spaghetti behind
  the machine was the only spot it would reach. So it sits well back among the cables rather than
  filling the frame, and that tiny superscript ends up only a few pixels tall, right where a
  recogniser collapses detail into the nearest simple shape. Real captures happen in real, awkward
  places.
- **Glossy, low-contrast e-ink under a lamp** — less edge definition to begin with.

The honest fix is *not* in the app. Teaching the pipeline that `"` might mean "th" and silently
rewriting it is the exact guess-dressed-as-a-read we refuse: it would make this card pass and destroy
the guarantee. The right fixes are upstream — **author a plain "16th"** and **fill the frame** — with
the editable Normalized pane as the safety net (change `"` to `th`, re-verify, green). A "card too
small — move closer" capture hint is a fair future affordance: a prompt, not a silent correction.

## Why the app fails loudly and shows its working

The tempting "fix" for all three was the same wrong move — lowercase everything, fuzzy-match, map
`"`→"th", try variants until something verifies. Each would make *this* card pass and turn the verifier
into a rubber stamp. So the app does the opposite: three tabs — **Captured** (see it was small, glossy,
angled), **Extracted** (exactly what OCR produced, in the order it returned), **Normalized** (the exact
bytes about to be hashed, editable, with Re-verify). That transparency is why any of these were
findable, and why failure two was *diagnosable*. **The failure is legible, and legibility is the
feature.**

## The lessons

1. **The hash is unforgiving on purpose, so the input pipeline must be inspectable.**
2. **Never silently discard or "correct" content — surface it.** Truncation is now loud; `"` is never
   quietly rewritten to "th".
3. **Don't trust OCR reading order.** Vision returns unordered regions; a horizontal-overlap guard
   beats trusting vertical positions on an angled capture.
4. **Author credentials to survive OCR.** Avoid glyphs that collapse under pixels (superscript
   ordinals, fancy typography); don't let claim lines wrap.
5. **Fill the frame.** A small card starves the recogniser of the detail that decides the hash.
6. **Cheap hardware is a first-class test case.** A ~$30 [Vidabay](https://vidabay.net) e-ink panel is
   where credentials are heading; a pipeline that only works on pristine laser print doesn't work.

One prop card, three failure classes. Two were our bugs and are fixed in shipped code. One is a
reminder that how you *print* and *capture* a credential is part of the system too. At no point did the
app guess its way to a false pass — it showed what it read, why it stopped, and handed back a
one-character fix. That's not a workaround for the design. That *is* the design.
