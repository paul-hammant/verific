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
| Trust root | Accumulated narrator track record | An `authorizedBy` chain terminating at a jurisdiction's root namespace (e.g. `gov.uk/verifiers`) |
| Output | serve / review / quarantine | verified / not-verified + status |
| Truth stance | Probabilistic (how reliable) | Binary (unaltered vs. altered) |
| Handles | Distortion *by AI transformers* | Forgery/tampering *of documents* |

## A subtlety: Live Verify has a chain too — but a different kind of chain

It is tempting to reduce Live Verify's trust root to "the issuer controls a domain." That is only the
leaf. Control of the issuing domain proves the artifact came from *that* domain — it does not, on its
own, prove the domain is a *legitimate authority* for the claim. Live Verify closes that gap with an
**authority chain** (see [authority-chain-spec.md](./authority-chain-spec.md)): a relying party walks
`authorizedBy` links from the issuer up to a regulator and, where one exists, to a jurisdiction's
**root government namespace** — `gov.uk/verifiers`, `usa.gov/verifiers` (CISA-controlled `.gov`), and
per-country equivalents. HSBC → HMRC → `gov.uk` is the canonical worked example: the employer attests
the fact, HMRC attests HSBC is a real PAYE employer, and the root namespace attests HMRC is a genuine
government service.

This is worth stating precisely, because it changes the shape of the comparison. **Both frameworks
are chain-based, but the chains carry different things:**

- **Isnad's isnād is a *transmission* chain** — the ordered list of hands a claim *passed through*
  (source → scraper → model → model). Each hand is graded on how reliably it forwards claims.
- **Live Verify's authority chain is a *vouching* chain** — not who relayed the artifact, but who
  *vouches the issuer is entitled to issue it*. It terminates not at a track record but at statute /
  a sovereign root namespace.

So where Isnad answers "how trustworthy is this *path of transmitters*?", Live Verify's authority
chain answers "is this issuer a *legitimate authority*, all the way up to a government root?" Both
refuse to stop at the leaf; they just walk in different directions — Isnad backwards through
*transmission*, Live Verify upwards through *authorization*.

## Why they compose rather than compete

Isnad grades soft, statistical, in-pipeline transmission reliability. Live Verify gives hard, binary,
cryptographic proof at a domain boundary. These are different trust primitives operating at different
positions in the stack, and they slot together cleanly:

- **A Live Verify seal is an ideal high-trust narrator input to an Isnad chain.** A
  cryptographically-anchored, authority-chained source is exactly the kind of link that deserves a
  top narrator grade. Isnad already has a `NarratorType` for `source`; a hash-verified Live Verify
  artifact is a *strong* narrator — its integrity axis (ʿadālah) is anchored by cryptography *and* by
  an authority chain to a sovereign root, rather than by accumulated track record. A Live Verify seal
  can thus bootstrap a narrator to a high grade on day one, before any evidence history exists.
- **Conversely, Isnad's honest-limit ethos and its "grade the chain, not the content" framing is
  essentially the same design philosophy the Live Verify use-case corpus already applies** — the two
  projects independently arrived at the same discipline of refusing to over-claim.

**Bottom line:** same philosophy (provenance plus honesty about limits), different trust primitive
(graded reputation vs. cryptographic domain-anchoring), and different position in the stack
(in-AI-pipeline vs. cross-org document). A hash-verified Live Verify artifact is a strong narrator in
an Isnad isnād; an Isnad pipeline is a natural downstream consumer of Live Verify-sealed sources.
