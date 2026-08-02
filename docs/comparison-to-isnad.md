# Live Verify vs. Isnād–Rijāl: Two Provenance Answers to One Question

Both Live Verify and the **Isnād–Rijāl Framework** (Ali Zahid Raja, *"Grading the Narrators,"*
paper: [arxiv.org/abs/2607.24117](https://arxiv.org/abs/2607.24117); code:
[github.com/alizahidraja/isnad](https://github.com/alizahidraja/isnad)) attack the same root
problem — **"why should I trust this claim that reached me through a chain of hands?"** — and both
reach for a *provenance* answer rather than a *plausibility* answer. But they sit at opposite ends
of the trust pipeline. They are complementary rather than competing.

## What each one actually is

**Isnad** grades the *transmitters* of a claim inside a multi-agent AI system. It borrows classical
hadith science: every claim carries its full chain (isnād); each transmitter — scraper, ingestion
model, synthesis model, source — gets a graded reliability score per domain (rijāl); the chain is
scored by its weakest link; independent chains can corroborate (mutābaʿāt); and content is
criticized separately from chain quality. A 4×2 decision matrix routes each claim to
**serve / review / quarantine**. It answers: *given this specific chain of AI transformers, how much
should I trust the output?*

**Live Verify** seals a *specific artifact* to an *issuer domain* via SHA-256 hash plus a `verify:`
lookup, so a third party can confirm what/when/unaltered and that a named issuer stands behind it.
It answers: *is this document the one the issuer actually issued, unmodified?*

## The real overlaps

1. **Provenance over plausibility.** Both explicitly refuse to judge a claim by how convincing it
   looks. Isnad grades the narrators; Live Verify anchors to the issuer's domain. Neither trusts
   content on its face.

2. **Weakest-link / chain thinking.** Isnad's isnād is a formal transmission chain graded
   end-to-end. Live Verify's whole pitch is collapsing a multi-hop chain of custody (forwarded PDFs,
   retold claims, "the agency said…") into one domain-anchored check — the same "don't trust the
   retelling" instinct.

3. **A shared honesty discipline.** This is the strongest cultural overlap. Isnad's README carries a
   "What's Validated vs. What's Not" box and reports two of its own results as *inconclusive rather
   than positive*. Live Verify's use cases lead with an **"honest limit — read this first"** section
   on every page (the IDV attestation openly states *"Live Verify does not detect deepfakes and
   cannot perform liveness"*). Both projects treat scoping-out over-claims as a first-class feature,
   not an afterthought. See [point-in-time-vs-current.md](./point-in-time-vs-current.md) for Live
   Verify's canonical version of this discipline.

4. **Trust decoupling.** Isnad separates *chain quality* from *content truth* (matn criticism). Live
   Verify separates *authenticity* (what/when/unaltered) from *truth of the underlying fact* — the
   recurring "authentic ≠ true, authentic ≠ current" pattern.

## Where they differ

| | **Isnad** | **Live Verify** |
|---|---|---|
| Layer | *Inside* an AI pipeline, per-claim | *Between* organizations, per-artifact |
| Mechanism | Graded reputation registry + Bayesian evidence loop | Cryptographic hash + domain endpoint |
| Trust root | Accumulated narrator track record | Issuer's control of a domain |
| Output | serve / review / quarantine | verified / not-verified + status |
| Truth stance | Probabilistic (how reliable) | Binary (unaltered vs. altered) |
| Handles | Distortion *by AI transformers* | Forgery/tampering *of documents* |

## Why they compose rather than compete

Isnad grades soft, statistical, in-pipeline transmission reliability. Live Verify gives hard, binary,
cryptographic proof at a domain boundary. These are different trust primitives operating at different
positions in the stack, and they slot together cleanly:

- **A Live Verify seal is an ideal high-trust narrator input to an Isnad chain.** A
  cryptographically-anchored, domain-attested source is exactly the kind of link that deserves a top
  narrator grade. Isnad already has a `NarratorType` for `source`; a hash-verified Live Verify
  artifact is a *strong* narrator — its integrity axis (ʿadālah) is anchored by cryptography rather
  than by accumulated track record.
- **Conversely, Isnad's honest-limit ethos and its "grade the chain, not the content" framing is
  essentially the same design philosophy the Live Verify use-case corpus already applies** — the two
  projects independently arrived at the same discipline of refusing to over-claim.

**Bottom line:** same philosophy (provenance plus honesty about limits), different trust primitive
(graded reputation vs. cryptographic domain-anchoring), and different position in the stack
(in-AI-pipeline vs. cross-org document). A hash-verified Live Verify artifact is a strong narrator in
an Isnad isnād; an Isnad pipeline is a natural downstream consumer of Live Verify-sealed sources.
