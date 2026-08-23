# Where Live Verify and ISNAD genuinely overlap

> **Status:** working note, from the Live Verify side, in reply to ISNAD's
> [`candidate-live-verify-overlap.md`](https://github.com/alizahidraja/isnad/blob/main/docs/candidate-live-verify-overlap.md).

Working the candidate cases through carefully, a genuine overlap between Live Verify and
[ISNAD](comparison-to-isnad.md) is **narrower and more specific** than "wherever an aggregator
summarises upstream claims." It reduces to **four cases**, in exactly **two directions**.

## The test

A use case is a genuine overlap only if **both** hold:

1. **There is a real transformation, not just transcription.** An aggregator that only *fetched and
   relayed* upstream claims can be disintermediated — each source verifies directly against its own
   issuer, and the aggregator evaporates (that is a Live Verify *collection* or *roster*, with nothing
   to grade). Overlap needs an aggregator that *transforms* — produces a claim no underlying source can
   independently confirm (a statistical result, a built artifact, a placement laundered through many
   hands).
2. **There is a willing Live Verify issuer.** No overlap exists where the party positioned to issue the
   claim is a one-hop primary source (it just vouches for itself), or an incumbent whose business is
   selling un-verifiability and who will not publish a portable, checkable claim. If no Live Verify
   object is issued, there is nothing for ISNAD to gate or to feed on.

## The two directions

The four survivors split cleanly into two kinds of overlap — and they run in **opposite directions**.
In both, Live Verify and any grader **never touch directly**: a **portal's own approver bot** is the
intermediary, and it may consult ISNAD *or any grader*. `PENDING` below is a *proposed* Live Verify
status, not shipped.

### Gate-issuance — evidence → issuance (ISNAD → Live Verify)

The issuer is a **willing chokepoint** that can withhold its `OK` at a discrete issuance moment. Its
approver bot consults a grader *before* publishing, and the bad `OK` never happens. The grader's
verdict flows **in**; a Live Verify status flows **out**.

- **Software releases at a distribution portal** — the worked case. `tarball ≠ tag` is a real,
  untraceable transformation; the portal is a willing chokepoint; the gate fires at upload, before the
  release ships. See [xz-release-attestation-case-study.md](xz-release-attestation-case-study.md).
- **Clinical-trial attestations** (sites → CRO → sponsor) — the sponsor's trial-level result (a
  statistical analysis over a locked database) is a genuine transformation *no single site can
  confirm*. The sponsor is a willing chokepoint issuing at **database-lock**, and the gate-able signal
  (site-data fabrication) is available *at issuance* and matters *before* the result reaches regulators
  and the literature. A locked-DB Merkle-root commitment binds the exact dataset the statistics ran on;
  the grader supplies the site-integrity half.

### Feed-grading — datapoints → grading (Live Verify → ISNAD)

The single claim is *walked*, not gated — pure Live Verify. But the **recurring parties** across many
such claims are what a grader grades in aggregate. Live Verify emits domain-anchored, self-evidencing
**datapoints**; a grader ingests the stream, accumulates per-party grades and correlated-lineage
(*madār*) findings, and those grades can inform curation downstream. The datapoints flow **out** of
Live Verify **into** the grader.

- **Product conformity certificates** (sub-labs → certifier) — each certificate is walked mechanically
  (catches forgery), but the Medpro fraud is a *rubber-stamping lab whose reports authentically
  verify*. Labs **recur across thousands of certificates**; recalls and retest failures attach back to
  the recurring lab. The corpus already holds both ends of the loop:
  [accredited-testing-laboratories](../public/use-cases/accredited-testing-laboratories.md) (the
  recurring parties) and [product-recall-status](../public/use-cases/product-recall-status.md) (the
  adverse-outcome feed). Certificate scope-enrichment (tested-for / run-size / retest) is Live Verify's
  *own* disclosure axis — neither direction.
- **Ad / web-page region provenance** — each placement manifest is a self-evidencing datapoint naming
  the chain; the single reveal is a browser-drawn walk, ungated. But the *recurring* resellers and
  presenters across the whole ad ecosystem are graded in aggregate, and the **functional kind** of a
  recurring party (a genuine exchange vs. a pass-through reseller) emerges from the shape of
  who-attests-whom across many placements — a corpus-structure property a grader derives, not a single
  walk. See [ad-placement-provenance](../public/use-cases/ad-placement-provenance.md).

## Summary

| Overlap | Direction | Why it qualifies |
|---|---|---|
| **Software releases** | Gate-issuance (ISNAD → LV) | Real transform (tarball ≠ tag); willing chokepoint; gate before harm |
| **Clinical trials** | Gate-issuance (ISNAD → LV) | Statistical transform no site can confirm; chokepoint at DB-lock; site-integrity gate |
| **Product conformity certs** | Feed-grading (LV → ISNAD) | Recurring labs; authentic-but-rubber-stamped reports; recalls feed grades |
| **Ad-placement provenance** | Feed-grading (LV → ISNAD) | Recurring ad-tech parties; functional role emerges from corpus structure |

## Related (ours)

- [comparison-to-isnad.md](comparison-to-isnad.md) — the general comparison and both compose-points.
- [xz-release-attestation-case-study.md](xz-release-attestation-case-study.md) — the gate-issuance
  worked case and the portal-approver-bot framing.
- [multi-known-endorser-roster.md](multi-known-endorser-roster.md) and
  [embedded-claim-downstream-portals.md](embedded-claim-downstream-portals.md) — the collection/roster
  and portal-intermediary primitives that account for the non-overlapping cases.
