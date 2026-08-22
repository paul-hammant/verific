# Case study: the xz-utils backdoor as a Live Verify release attestation

> **Status:** draft for discussion.
>
> This is the Live Verify half of a two-repo case study. The other half —
> [Case study: the xz-utils backdoor as a sleeper narrator](https://github.com/alizahidraja/isnad/blob/main/docs/case-study-xz-sleeper-narrator.md)
> in the ISNAD repository — reads the same incident through ISNAD's
> narrator-grading vocabulary and carries the full factual timeline. This
> document assumes that narrative and asks only: *what would a Live Verify
> claim for an xz release have looked like, what would it have said on each
> side of the CVE, and what chain of endorsers could have stood behind it?*
> The two documents are meant to be read together; the incident is the
> cleanest illustration we have of how far apart the two projects sit, and
> where they compose.

## Terms used here (for the reader arriving cold)

You need a hash and a CVE; the rest this box supplies. Every term below is used
in this document.

- **`verify:` line / lookup** — a short line a document carries (e.g.
  `verify:pkg-v.tukaani.org`) naming the domain that stands behind it. A client
  hashes the claim text and asks that domain whether the hash is one it
  published. A `200 OK` means "yes, unaltered"; a `404` means "not that, or not
  anymore." That is the whole mechanism.
- **Issuer / endorser** — the *issuer* is the domain that made the claim; an
  *endorser* is a different domain that vouches the issuer is legitimate.
  "Verified by the issuer, endorsed by others" — the endorsers never saw the
  document, they vouch for the *party*.
- **RECANT / RESTRICT** — the two ways a live claim can be withdrawn: the issuer
  **recants** its own claim (status flips to `REVOKED`); an endorser
  **restricts** an issuer it no longer backs (status `RESTRICTED`). Because the
  lookup is live, every later re-check sees the withdrawal.
- **Amber / anchored** — a claim that verifies but whose endorsers are *not*
  a recognised government root shows **amber** ("verified, but judge the
  endorsers yourself"), versus green/**anchored** when the chain reaches a
  sovereign root. Amber is a normal, honest state, not a failure.
- **Attestation ecosystem** (used in "the authority chain"): *Sigstore* — a
  public, tamper-evident log recording who built an artifact from which source;
  *reproducible / rebuilt from source* — an independent party recompiles the
  same git tag and checks it produces the identical bytes; *Trusted Publisher
  (OIDC)* — a package portal cryptographically tying an upload to the source
  repository it came from. All three answer "did this artifact really come from
  that source?", none answers "is it safe."

## Honest limit — read this first

**Live Verify would have said `verified` for xz 5.6.0 on 24 February 2024, and
it would have been right.**

The release was cut by the maintainer of record, from the project's own
infrastructure, on the project's own domain. It was exactly what the issuer
issued. Live Verify answers *"is this artifact the one the issuer stands
behind, unaltered?"* — and the answer was yes. The artifact was authentic.
That was the problem.

This is the [point-in-time vs current](point-in-time-vs-current.md)
distinction at its sharpest. Authentic ≠ true. Authentic ≠ safe. Live Verify
does not evaluate whether a release is free of backdoors, any more than it
evaluates whether a bank statement's balance is still there. Anyone
presenting Live Verify as a supply-chain *safety* signal is overclaiming, and
this document should not be read that way.

What Live Verify *does* offer the xz story is in the second half of it — the
revocation — and in the shape of the endorser chain an open-source release
can have. Both are covered below. The single most transferable idea is in
[Which colour](#which-colour): *amber measures anchoring, not strength* — a
claim can be "verified, no government behind it" and yet rest on stronger
evidence than a government-anchored one. That is the cleanest statement of how
Live Verify and ISNAD differ, and it is worth reading even if you skip the rest.

## The case in one paragraph

An account calling itself "Jia Tan" spent roughly two years contributing
clean work to xz-utils — the compression library behind `liblzma`, linked into
much of Linux userland — became co-maintainer, and in February–March 2024
shipped releases 5.6.0 and 5.6.1 containing a backdoor. What it did: on affected
systems it hooked into `sshd` (which pulls in `liblzma` indirectly) and let an
attacker holding a specific secret key run commands **as root, before
authentication** — a remote skeleton key for much of the internet's SSH. The
payload lived in binary test fixtures; the `m4` build macro that extracted it
existed **only in the release tarball, not in git** (so it was invisible to
anyone reading the source repository). It was caught, largely by luck, by Andres
Freund on 29 March 2024 (CVE-2024-3094) before reaching major stable
distributions. The identity behind the account has never been established;
the correct noun is *the xz account* or *the Jia Tan persona*, not "a
developer." Full timeline and sourcing are in the ISNAD document.

## The claim

The tempting version:

```
xz release 5.6.1 is official and supply chain safe as far as we know.

Sha256 for the tar.gz is a5c8df385923b36489b9d32d3f945037d45681c2d9e8f12a3b4c5d6e7f8a9b0c

verify:pkg-v.tukaani.org
```

That text contains a content assertion — "supply chain safe" — that the
issuer cannot actually stand behind and that Live Verify does not evaluate.
Live Verify's discipline is to keep the claim to what the domain *can* vouch
for:

```
xz 5.6.1 tar.gz, sha256 a5c8df385923b36489b9d32d3f945037d45681c2d9e8f12a3b4c5d6e7f8a9b0c,
is an official tukaani.org release.

verify:pkg-v.tukaani.org
```

Note the structure. The hash that is *looked up* is the SHA-256 of this
normalised text. The sha256 *inside* the text binds the artifact to the
claim. This is the same construction as the "also hash the file" PDF mode:
a hash of a text that contains a hash. The claim is short, human-readable,
and carries its own binding.

## The endpoint on each side of the CVE

**24 February – 28 March 2024:**

```
HTTP 200 OK
Status: OK
```

Correct. The issuer stands behind this exact text. No echo of the claim
content (the verifier already has it).

**29 March 2024 onward:**

```
HTTP 200 OK
Status: REVOKED
More: https://tukaani.org/xz-backdoor/
```

Still 200 — the endpoint exists, the hash is known — but the issuer has
**recanted**. This is the existing RECANT verb and the existing `More:` link
pattern (see the revoked medical-licence screenshot in the README). Every
human who pasted the claim into an email, a Debian bug, a Slack thread, and
re-selects it, sees the flip. Live Verify is, in this story, the **revocation
broadcast channel for humans**.

The endpoint says nothing about *why* beyond the link. That is correct. The
claim was "this is an official release"; the status says "we no longer stand
behind that"; the link carries the detail. Enrichment beyond that would
violate the no-echo rule for no gain.

## Who is the issuer?

Two candidates, and the choice matters.

**The project** (`pkg-v.tukaani.org`). Natural, but in this incident the
release manager *was* the attacker. The project domain saying "5.6.1 is
official" is Jia Tan saying Jia Tan's tarball is official. Self-attestation
here is not merely weak, it is the adversary's own voice. (It was also, for a
period after disclosure, unclear who controlled the project's infrastructure
at all; Lasse Collin regained it, GitHub suspended the repository in the
interim.)

**The distribution portal** (`verify:pypi.org`, `verify:npmjs.org`, a
distro's package index). Better: the portal vouches *"this is what the
maintainer of record uploaded through our publishing flow"* — not "this is
safe." Its authority basis is a real thing (account identity, 2FA, Trusted
Publisher OIDC binding to a source repository). And its revocation is
something it can do **independently of the project**, which turns out to be
essential below. A portal-issued Live Verify claim is the portal's
quarantine made legible to a person.

## The authority chain

Open source has no regulator, no statute, and no sovereign root. Under the
four patterns in [authority-chain-spec.md](authority-chain-spec.md),
`tukaani.org` is **Commercial/Personal**: the chain would terminate at
self-authorised. The spec says self-attestation "warrants additional
scrutiny, not automatic rejection." For xz that is too gentle — the self was
the attacker. What an open-source release needs is not a chain *upward* to an
authority but a chain *sideways* to parties who are **not the same
narrator**.

```
Step 1 — issuer
GET https://pkg-v.tukaani.org/{claim-hash}
200  Status: OK
X-Verify-Authority-For:          release-attestation
X-Verify-Authority-Scope:        maintainer-of-record
X-Verify-Authority-Attested-By:  https://attest.github.com/v/{tukaani-meta-hash}
                                 https://rb.debian.org/v/{tukaani-meta-hash}
                                 https://rebuilder.fedoraproject.org/v/{tukaani-meta-hash}
```

| Step | Endorser | What it vouches | Scope | Terminates at |
|---|---|---|---|---|
| 2a | `attest.github.com` (Sigstore / build attestations) | artifact `a5c8…` was built by workflow W from tag `v5.6.1` at commit C | `build-provenance` | Sigstore root — self-authorised, backed by a transparency log |
| 2b | `rb.debian.org` | we rebuilt tag `v5.6.1` from git and got `a5c8…` bit-for-bit | `reproduced-from-source` | self |
| 2c | `rebuilder.fedoraproject.org` | same, independently | `reproduced-from-source` | self |
| 2d (optional) | `pypi.org` / `npmjs.org` | uploaded via Trusted Publisher OIDC from repository R | `published-by-maintainer-of-record` | self |

What the walk proves:

1. `tukaani.org` stands behind this hash — *attacker-controlled; proves nothing alone.*
2. The artifact came out of CI from a git tag. **The `m4` injection fails
   here.** The payload-extracting file existed only in the hand-rolled
   tarball, never in git, so no build-provenance attestation could cover it.
   To pass 2a the attacker must compromise CI, or commit the payload where it
   is reviewable.
3. Two independent parties rebuilt the release from the git tag and got the
   same bytes (this is *reproducible builds* — recompile the source, compare the
   output byte-for-byte). The tarball-≠-tag attack is caught mechanically, by
   organisations that disagree about everything except `make`.

And the sharper point: **step 2a would not have existed.** xz releases were
not CI-built. The `Attested-By` header would have been absent; the app would
have shown *"self-attested; no authority chain presented."* Not a red light
— the absence of a chain is a neutral state by design — but the person
deciding would have seen that the only voice behind this release was the
release manager's. That is the Live Verify rendering of what the ISNAD
document calls a chain gap (*munqaṭiʿ*).

## Which colour

Suppose the chain above *had* existed. Under the three-state display in
[sovereign-roots.md](sovereign-roots.md) it is **amber-unanchored**: a real
chain with real endorsers, terminating at Debian, Fedora and Sigstore rather
than at any entry on the sovereign-roots list. The app says: *"endorsed by
Debian, Fedora and Sigstore; no government or regulator attests to those
endorsers — judge them yourself."*

That is the honest colour, and it exposes something worth stating plainly:

**Amber measures anchoring, not strength.** Three mutually independent
rebuilders who all produced the same bytes are *more* resistant to the xz
attack than a single `gov.uk` link would be. Independence is what defeats a
patient attacker; a sovereign root supplies legitimacy, not independence.
Live Verify's colour is correctly answering "is this issuer a recognised
authority?" — no. ISNAD's grade is answering "how many independent hands
agree?" — three. Both are right about their own axis, and the amber state's
job — per [dual-channel-trust.md](dual-channel-trust.md) — is to hand that
weighing back to the human, who is the one able to set "unanchored but
triply reproduced" against "anchored but self-issued."

**The route to green exists.** Amber is not permanent for this pattern. The
EU Cyber Resilience Act creates conformity-assessment bodies for software
products with a statutory basis — a Regulated-pattern chain (steward →
notified body → EU regulation) for open source for the first time. CISA runs
`.gov` and has already put its name behind SBOM and secure-by-design; a
`usa.gov/verifiers` endorsement of Sigstore's root or of a rebuilder network
would anchor step 2a. Germany's BSI (`bund.de`) is the other plausible early
mover. When any of those land, the *same* chain walks to green with no change
at the issuer — the issuer publishes once; anchoring is something the
endorsers acquire later. The first sovereign to recognise a rebuilder network
turns amber to green for every package behind it at once.

## Revocation has to work from the endorser side

On 29 March, who flips the status? The project domain was, briefly, still
the attacker's. So endorsers must be able to withdraw **independently of the
issuer**. In the incident, that is what actually happened: GitHub suspended
the repository; Debian and Fedora pulled the packages.

In Live Verify terms: an endorser removes the issuer's meta hash from its
store (the backward-walk in the spec already implies endorsers hold it), and
step 2 returns `RESTRICTED` with a fixed reason code — `cve-2024-3094` —
while step 1 may still say `OK`. The app should surface that contradiction
loudly: *issuer says fine; endorsers say no.* This is the most important
single behaviour in the whole case, because it is the one that does not
depend on the compromised party's cooperation.

## Is the prose gratuitous?

A reasonable objection: machines already have attestations (Sigstore, SLSA,
npm provenance, PEP 740). For machine-to-machine, the sha256 *is* the
artifact, and wrapping it in a sentence adds nothing.

True, and not the point. Live Verify's niche is the **human at a decision
point with no tooling** — which is exactly who was deciding in the xz case:

- Lasse Collin, reading "Jigar Kumar"'s emails in 2022 arguing he should hand
  over maintainership
- A Fedora maintainer, reading Jia Tan's direct email asking for 5.6.1 to be
  included because it "fixes a valgrind issue"
- A Debian triager, reading "Hans Jansen"'s bug report asking for 5.6.x to be
  pulled

Imagine the Debian bug contained a Live Verify claim. The triager selects it
and verifies — and finds it resolves on `hansjansen.example`, not
`tukaani.org`, or does not verify at all. The prose is what makes a claim
something a person can *carry* between channels (email → bug tracker → chat)
and someone else can *check* without infrastructure. That is what Live Verify
does that attestations do not, and it is why the text form is not decoration.

## Where this composes with ISNAD

The existing [comparison-to-isnad.md](comparison-to-isnad.md) observes that a
Live Verify seal is a strong *narrator input* to an ISNAD chain. This case
shows the other, stronger half: **a Live Verify revocation is an ISNAD
evidence record.**

A revocation is a fact — *"issuer X recanted artifact Y at time T"* or
*"endorser E restricted issuer X for reason R at time T"* — not a judgement.
ISNAD's design implication for cross-operator trust is exactly *share
evidence, never grades*: operators exchange facts and re-derive grades under
their own policy, never importing anyone's verdict. A Live Verify status flip
is precisely the kind of cheap-to-verify, hard-to-forge fact that model
wants. The two projects meet there: Live Verify produces the human-legible,
domain-anchored fact; ISNAD consumes it as evidence against a narrator.

Side by side:

| | Live Verify | ISNAD |
|---|---|---|
| 24 Feb 2024 | `OK` — correctly; it was official | chain capped (tarball ≠ tag); release-manager grade short → caveats |
| 29 Mar 2024 | `REVOKED` / endorser `RESTRICTED`; every human re-check sees it | `HUMAN_REVIEW` → permanent integrity strike on the narrator |
| Answers | "Is this what the issuer issued?" | "How much should I trust the hands it passed through?" |
| Human | at the threshold, deciding | at the review queue, adjudicating |
| Colour / grade | amber-unanchored (real chain, no sovereign root) | three independent corroborators |

Neither stops xz alone. Live Verify had nothing to say about *safety* and
was honest about it; ISNAD had structural caveats but no verdict. Together,
the portal's quarantine becomes a human-legible status, the rebuilders'
agreement becomes an independent-chain corroboration, and the eventual
revocation becomes evidence that outlives the incident.

## Spec gaps this case exposes

None of these are proposals yet; they are where the case points.

1. **Horizontal endorsement.** `X-Verify-Authority-Attested-By` is singular
   in the spec — one link *up*. Open source has no "up"; it has *sideways*:
   N independent rebuilders. The header needs to carry a list, and the app
   needs a "k of n endorse" rendering. This is independent-chain
   corroboration (ISNAD's *mutābaʿāt*) in Live Verify clothing.
2. **Endorser-initiated RESTRICT.** The RECANT/RESTRICT verbs are documented
   as subject and issuer controls. The endorser needs them too, with its own
   fixed reason codes, because the issuer may be the compromised party.
3. **A scope vocabulary for releases.** `build-provenance`,
   `reproduced-from-source`, `published-by-maintainer-of-record` are not in
   the spec. They are cheap to add and map one-to-one onto the structural
   checks that distribution portals already run.

## Authority Chain

| Field | Value |
|---|---|
| Issuer domain | `pkg-v.tukaani.org` (project) or `pypi.org` / `npmjs.org` (portal) |
| `authorizedBy` | *(self-authorised)* — or, sideways, `attest.github.com`, `rb.debian.org`, `rebuilder.fedoraproject.org` |
| `authorityBasis` | Maintainer of record for xz-utils; no regulator, no statute |
| Anchoring | Unanchored (amber) until a sovereign root recognises a rebuilder network or attestation root |

## Related

- [ISNAD: Case study — the xz-utils backdoor as a sleeper narrator](https://github.com/alizahidraja/isnad/blob/main/docs/case-study-xz-sleeper-narrator.md)
  — the other half of this case; full timeline, the sleeper-narrator attack
  pattern, and which of ISNAD's mechanisms answer it.
- [comparison-to-isnad.md](comparison-to-isnad.md) — the general comparison
  this case instantiates.
- [point-in-time-vs-current.md](point-in-time-vs-current.md) — authentic ≠
  true-now; the discipline the honest-limit section above rests on.
- [authority-chain-spec.md](authority-chain-spec.md) — the four patterns and
  the `Attested-By` walk.
- [sovereign-roots.md](sovereign-roots.md) — the three-state
  anchored / amber-unanchored / no-chain display.
- [dual-channel-trust.md](dual-channel-trust.md) — why amber hands the
  decision back to the human.
- [verification-enrichment-hazards.md](verification-enrichment-hazards.md) —
  the RECANT / RESTRICT verbs and why there are only two.
