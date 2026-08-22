# Multi-Known-Endorser Roster: a live, growing set of independent confirmations

> **Status:** design note / proposal. Not implemented in any client.

Some claims are corroborated not by an *authority above* them but by *many independent people
beside* them. A professional-history claim, a skills or reference claim, an open-source contribution
claim — its credibility comes from the number of independent parties who will, on their own domains,
say "yes, that's true." This doc specifies that pattern: a **live endorsement roster**.

It is the human counterpart to the *machine* independent-corroboration in the
[xz case study](xz-release-attestation-case-study.md) (where independent rebuilders confirm the same
bytes), and it is [ISNAD](comparison-to-isnad.md)'s *mutābaʿāt* — independent-chain corroboration — in
Live Verify form.

## The shape

A claim carries a single `verify:` line pointing at a **roster endpoint**:

```
I led the build-tooling practice at Acme for 12.5 years (2004–2016).

verify:example.com/lists/g/
```

The claim text hashes to `H`. `GET verify:example.com/lists/g/{H}` returns a **list**, not a verdict —
JSON naming the current set of people who have agreed to endorse *this exact claim*:

```json
{
  "endorsers": [
    "verify:alice.example/endorsements/",
    "verify:bob.example/endorsements/",
    "verify:carol.example/endorsements/"
  ]
}
```

The client then **fans out to each endorser independently**, on that endorser's own domain:

```
GET verify:alice.example/endorsements/{H}   → 200  {"verified": true}
GET verify:bob.example/endorsements/{H}     → 200  {"verified": true}
GET verify:carol.example/endorsements/{H}   → 404          (silent — see limits)
```

Each `verified:true` is one independent domain vouching for the *exact* claim text. The result is a
count of confirmations: **2 of 3** here.

## The roster confers nothing on its own

**This is the load-bearing rule.** The roster endpoint returning `200` means only that *a list
exists*. It is a directory, not an attestation. It is **not** an endorsement, and it is **not** a
self-attestation by the claimant.

- If the roster names 20 people and **all 20 return 404**, the claim is **unendorsed** — displayed as
  uncorroborated, never as "verified" or even amber. A roster full of silence is a weak state, arguably
  a caution ("named 20 supporters; none confirm"), never a neutral or positive one.
- Publishing a list of hoped-for endorsers earns the claimant nothing. Only the live `verified:true`
  responses from *other* domains count.

So the trust state is **purely a function of the confirmed count**, and it scales with it: 0 confirmed
is nothing; k confirmed is k independent voices; more is stronger.

## The originator is a substrate, not a signal

The claimant's own domain is where the seed text and the roster live, but **the originator carries no
weight in the verdict and must not appear in it.** The claim text is a *substrate* that the endorsers
attach to — a jumping-off point — not evidence in itself.

Concretely: the rendering says **"endorsed by 17 of 20"** and nothing about who wrote the seed. It does
**not** say "self-attested by example.com, plus 17 endorsements" — surfacing the originator as if it
were part of the trust would be false weight, and would hint at a judgement the protocol has not
earned. Only the confirmed count and the endorsing domains are shown. Who *started* the sentence is
immaterial to how much it should be trusted.

(If a claimant *also* wants ordinary self-attestation — "these are genuinely my unaltered words" — that
is a **separate, ordinary** self-verified claim on a different endpoint, with the usual amber
treatment. It is not part of the roster mechanism and does not combine into the roster's count.)

## Bound to exact text

The roster is keyed by the claim hash `H`. Endorsers confirm `H` — the *exact* wording. This makes
endorsement tamper-evident:

- Edit one word of the claim → new hash `H'` → the roster for `H'` is empty (nobody has endorsed the
  new wording). You cannot quietly reword a claim and carry its endorsements along.
- An endorser is vouching for *specific text*, not for the person in general. That is a feature: it
  keeps "I confirm Paul ran that practice for 12.5 years" from being reused to back a different, edited
  sentence.

## Live in both directions

Because every lookup is live:

- **Growth needs no re-issue.** A 21st endorser opts in → the roster returns 21 → every future
  verification of the *unchanged* claim shows 21. The claimant never reprints, re-hashes, or
  re-publishes. The claim is static; the corroboration is live.
- **Withdrawal is immediate.** An endorser who changes their mind flips their own endpoint to 404; the
  confirmed count drops on the next check, everywhere. Endorsers control their own voice.

## Printed vs. page: progressive enhancement

The medium decides how much of the roster can be *shown*, and the pattern degrades honestly.

- **Printed / no tooling.** The claim shows one `verify:example.com/lists/g/` line. A phone camera can
  verify the roster *exists* and show a count and a link ("20 endorsements listed at
  example.com/lists/g — check them"), but paper cannot expand and independently confirm 20 live
  endpoints. The paper carries the *pointer*, not the *proof*. Honest headline: "roster of 20 claimed;
  confirm at the link."
- **In-page, with the verification extension.** The extension fetches the roster, fans out to all
  members in parallel *in the reader's own browser*, and renders the live result: "✓ 17 of 20
  independent endorsers confirm," with the domains shown. **The expansion is a function of the client**,
  not of the claim. Same bytes; richer where the tooling exists.

This is progressive enhancement applied to trust: an honest count-plus-pointer on paper, a verified
k-of-n panel in a capable client, from identical claim bytes.

## Colour: independence is not authority

A roster confirmed by 20 independent people is **amber**, not green — and correctly so. Twenty peers
are strong *independence*, but none of them is a recognised **authority**; the chain reaches no
sovereign root (see [sovereign-roots.md](sovereign-roots.md)). This is the same axis the xz case makes
explicit: **amber measures anchoring, not strength.** A claim can rest on 20 independent confirmations
and still, honestly, not be green — and 20 independent confirmations can be *stronger evidence* than a
single authority endorsement. The app's job, per [dual-channel-trust.md](dual-channel-trust.md), is to
show the count and the domains and hand the weighing to the human.

## Honest limits — read before rendering a number

1. **Confirmed, never claimed.** The headline is always the *confirmed* count (the live `verified:true`
   responses), never the roster's length. "17 of 20" is honest; "20 endorsers" (the roster length) is
   not, because the claimant controls the list but not the confirmations.
2. **Independence is asserted, not proven.** Twenty endorsing domains could be twenty accounts the
   claimant controls — the [madār / sock-puppet](comparison-to-isnad.md) problem. The client can *show*
   the domains so a human can judge whether they look independent; the protocol cannot *prove* they are.
   This is the honest ceiling, the same one that applies to all self-adjacent verification.
3. **Absence is not dissent.** An endorser at 404 has not *rejected* the claim — they may simply not
   have endorsed it, or not yet. "0 of 20" means *uncorroborated*, not *refuted*. The UI must not read
   silence as disagreement. (Uncorroborated is still correctly weak; it just is not a "no.")

## Where it applies

- Professional-history and reference claims (the motivating case).
- Open-source contribution claims ("I maintained X from 2019–2023").
- Skills / competency attestations corroborated by peers.
- Community and membership attestations.
- The [employment references](../public/use-cases/employment-references.md) and
  [candidate work-sample provenance](../public/use-cases/candidate-work-sample-provenance.md) use
  cases could adopt it where corroboration is peer-based rather than institutional.

It is **not** appropriate where a single *authority* is the right trust source (a degree, a licence) —
there the [authority chain](authority-chain-spec.md) upward is correct, not a roster sideways.

## Related

- [xz-release-attestation-case-study.md](xz-release-attestation-case-study.md) — the *machine* version
  of independent corroboration (rebuilders confirming bytes); this doc is the *human* version.
- [comparison-to-isnad.md](comparison-to-isnad.md) — this is ISNAD's *mutābaʿāt* (independent-chain
  corroboration) rendered in Live Verify; note ISNAD's caution that independent chains lift a claim only
  so far, never to certainty.
- [sovereign-roots.md](sovereign-roots.md) — why a peer-endorsed claim is amber, not green.
- [dual-channel-trust.md](dual-channel-trust.md) — the app hands the count-weighing to the human.
- [public-suffix-operator-disclaimer.md](public-suffix-operator-disclaimer.md) — a related "one endpoint
  speaks for many" idea, in the opposite direction (an operator disowning tenants).
