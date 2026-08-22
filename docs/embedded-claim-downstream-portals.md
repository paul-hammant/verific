# Embedded Claims: splitting supply-chain labour fairly between maintainer and portal

> **Status:** design note / proposal. Not implemented in any client.

This doc addresses a scaling problem the [xz case study](xz-release-attestation-case-study.md) raises:
a package-release attestation whose trust fans out to N independent rebuilders asks the **upstream
maintainer** to be the hub of a coordination they cannot sustain. The fix is to invert the burden — the
maintainer does one near-zero-effort thing, and the **downstream distribution portal** (Debian, Fedora,
a package index) does the heavy lifting it was already doing, by *embedding* the maintainer's claim
inside its own.

## The scale argument

Software package counts have roughly doubled every 2–4 years per ecosystem for a decade. npm alone is
in the millions; PyPI, crates.io, Go modules, Maven, RubyGems, the distro archives, Nix, Homebrew add
millions more. A plausible ten-year figure is **tens of millions of packages across dozens of
ecosystems** — the large majority maintained by a single unpaid person. xz-utils *was* the archetypal
solo, unfunded maintainer.

Any trust architecture that makes the **maintainer** the coordinator of a fan-out — publish a claim,
then wrangle N rebuilder endorsements, maintain endpoints, keep them in sync forever — has put the
coordination burden on exactly the party with the least capacity. It will not scale, and it will fail
first on the long-tail packages where the next xz lives.

The burden must land on **capacity**. Distribution portals already rebuild, already sign, already run
security teams, already pull compromised packages. They are the vested interest with staff and
infrastructure. The design should ask almost nothing of the maintainer and let the portal do what it
already does.

## The mechanism: embed the upstream claim, verify it, re-issue

1. **The maintainer self-attests once — the whole of their duty.** One short claim, one endpoint on
   their own domain:

   ```
   liblzma 5.6.1, from tukaani/xz tag v5.6.1 (c26bd9d),
   sha256 of liblzma.so.5.6.1 = a5c8…b0c

   verify:tukaani.org
   ```

   This is amber (self-verified). It is the maintainer's entire obligation. They never list a
   downstream endorser, never maintain a fan-out, never re-issue for a distributor.

2. **The portal quotes that claim verbatim inside its own, and stands behind the composite.** Debian
   takes the upstream claim, embeds it, rebuilds from source, confirms it reproduces, and issues **its
   own** claim on **its own** domain:

   ```
   liblzma5 5.6.1-1 (Debian package), reproduced from source.
   Rebuilt from the upstream self-attested release below and confirmed bit-for-bit.

   >liblzma 5.6.1, from tukaani/xz tag v5.6.1 (c26bd9d),
   >sha256 of liblzma.so.5.6.1 = a5c8…b0c
   >verify:tukaani.org

   upstream-claim-sha256 = 7f31…e12

   verify:security-tracker.debian.org
   ```

   Debian verifies against `security-tracker.debian.org`. Fedora, Arch, Nix each do the **same,
   independently** — quoting the same upstream claim into their own. The maintainer is not involved in,
   and need not know about, any of it.

## The `>` quoting convention (and why the missing space matters)

The embedded upstream claim is prefixed line-by-line with `>`, like an email or Markdown quote. This is
not cosmetic; it carries protocol meaning:

- **`>` marks the block as quoted/embedded** — evidence of *what the portal verified*, not a set of live
  instructions to the current verifier. The active claim is the unprefixed one; its `verify:` line
  (`verify:security-tracker.debian.org`) is the live lookup.
- **The embedded verify line is written `>verify:` with NO space** — deliberately. A `verify:` /
  `vfy:` line is live only when it stands at a true line start with nothing glued to its front.
  `>verify:tukaani.org` is glued to the `>`, so it is **inert** — and, critically, this defeats the
  **camera / OCR** path specifically: OCR-artifact cleanup strips a set of leading border characters
  (`| ~ \` ^ * # + = / \ _ [ ] { }`) but **not** `>` (see `public/ocr-cleanup.js`), so `>verify:`
  survives cleanup as `>verify:` and never becomes a live `verify:`. Writing `> verify:` *with* a space
  would risk the cleanup stripping the `>` and firing an unwanted upstream lookup. The absence of the
  space is load-bearing.
- **The pinned `upstream-claim-sha256`** binds the composite to the *exact* upstream claim the portal
  verified. Change the quoted text and that hash no longer matches — the embedding is tamper-evident.

**Proposed rule:** *a `verify:`/`vfy:` line is live only at a bare line start; `>verify:…` (no space)
denotes a quoted, embedded, inert claim. Clip and camera paths must both honour this.*

## Why this splits the labour fairly

- **The maintainer's duty shrinks to one self-attested amber claim.** Near-zero, one-time, on their own
  terms. This is the whole point: it is sustainable for a solo unfunded maintainer.
- **The portal does what it already does.** Rebuild, verify, sign, and now additionally issue a Live
  Verify claim that embeds the upstream. Marginal effort for a party with a security team.
- **Trust flows the way it actually already flows.** A user does not trust liblzma because tukaani.org
  says so; they trust it because *Debian shipped it*. Embedding makes the real path —
  user → Debian → (Debian's verification of upstream) — legible, instead of pretending the user should
  evaluate the upstream maintainer directly.
- **Revocation lands where the power is.** When a package is compromised, the portal pulls it — without
  the upstream's cooperation, which matters when the upstream is the compromised party (as in xz, where
  the release manager *was* the attacker). In the embedding model, Debian flips **its own** claim to
  `REVOKED`, and every Debian user's re-check sees it, whatever the upstream domain still says.

## Embedding does not launder amber to green

The upstream claim stays amber inside the embedding; the portal does not upgrade it. What the portal
adds is **its own** responsibility: "Debian took this specific upstream claim and reproduced it from
source." That is a real, portal-backed fact — but it proves *"faithfully built what upstream tagged,"*
not *"safe."* (In xz the git source was clean of the payload extractor — it lived only in the hand-rolled
tarball — so `reproduced-from-source` would actually have *caught* it. But the general claim is
faithfulness to the tag, never safety.) The composite is only as anchored as the portal's own chain,
which the portal — not the maintainer — is responsible for cultivating toward a sovereign root
(EU CRA notified bodies, CISA, BSI; see the xz case study's "route to green").

## When to embed vs. when to roster

Embedding fits when there is a clear **downstream aggregator** that re-issues — a portal, a distro, a
notary. It does not fit when trust comes from **many independent peers with no single re-issuer**; that
is the [multi-known-endorser roster](multi-known-endorser-roster.md), where the endorsers each stand on
their own domain and no one embeds anyone. The two are complementary, chosen by whether a downstream
re-issuer exists:

- **Downstream aggregator exists → embed-by-reference** (this doc). One party re-issues, carrying the
  quoted upstream claim.
- **No aggregator, peer corroboration → roster.** N independent endorsers confirm the same claim live;
  the count is the trust.

## Honest limits

- **The composite is the portal's claim, and inherits the portal's honesty limits** — including that
  reproduced-from-source proves faithfulness to the tag, not absence of a backdoor in that tag.
- **The upstream `>verify:` is inert by design** — the verifier is trusting the *portal's* verification
  of the upstream (pinned by `upstream-claim-sha256`), not re-verifying the upstream live. If a verifier
  wants to independently check the upstream too, they can lift the quoted claim out and verify it
  separately; that is a deliberate second act, not the default.
- **Nothing here removes the need for someone to actually look.** Embedding makes the chain of custody
  legible and revocation effective; it does not detect a malicious-but-faithfully-built release. That
  remains a human/critic problem (see the xz case study and its ISNAD companion).

## Related

- [xz-release-attestation-case-study.md](xz-release-attestation-case-study.md) — the case this pattern
  is drawn from; why fan-out mis-allocates the burden and embedding fixes it.
- [multi-known-endorser-roster.md](multi-known-endorser-roster.md) — the complementary pattern for
  peer corroboration with no downstream aggregator.
- [verification-enrichment-hazards.md](verification-enrichment-hazards.md) — the RECANT / RESTRICT
  verbs a portal uses to withdraw.
- [sovereign-roots.md](sovereign-roots.md) — the anchoring the portal (not the maintainer) pursues.
