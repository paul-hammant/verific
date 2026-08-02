# Why Live Verify Is a Public Good, Not a Business

This doc is different from the rest of `docs/`. The others describe *how the protocol works*. This one
is about *what kind of thing the protocol is* — and it reaches an uncomfortable but honest conclusion:
the value Live Verify can create for the world and the value its author can capture are almost
unrelated, and that is by design, not by accident.

## The harder truth about "hundreds of billions saved"

It is entirely plausible that a comprehensive verification protocol — covering the ~600 use cases in
`public/use-cases/` — could save the world hundreds of billions of dollars annually in prevented
fraud, eliminated re-verification friction, and collapsed chains of custody.

That number describes **value created for the world.** It says nothing about **value capturable by
the author.** These two quantities feel like they should be linked. They are almost entirely unlinked.

- **TCP/IP** underpins essentially all networked value on Earth. Its designers captured roughly none
  of it.
- **Email** (SMTP) carries trillions of dollars of commerce. Its author captured roughly none of it.
- **The Web** (HTTP/HTML) created more economic value than almost any invention in history. Its
  inventor gave it away and captured roughly none of it — deliberately.

In each case the value came from the thing being **open and universal.** And that same openness is
*exactly* why the inventor couldn't fence it off. **The property that makes a protocol world-changing
is the same property that makes it uncapturable.** Those are not two facts. They are one fact stated
twice.

Live Verify sits squarely in this lineage. Its use cases are plausibly enormously valuable *because*
anyone can issue, anyone can verify, and no one has to ask permission. Strip that openness away to
build a moat and you have not protected the value — you have destroyed the mechanism that created it.

## Why the moat isn't there — three closed exits

The instinct on realising a thing is valuable is to ask "how do I capture it?" For Live Verify, an
honest walk through the candidate answers closes each one:

1. **Fence the protocol.** Impossible. It is published and openly licensed. A method described in
   public use cases and a reference implementation cannot be made exclusive.
2. **Sell a hosted reference implementation as SaaS.** Cloned in a week. If the product *is* the open
   reference code, a competitor stands up an identical service in days — cheaper, because they skipped
   the design work already published. A product whose only moat is "we implemented the open spec" has
   no moat in an age of near-zero implementation cost.
3. **Be the blessed government operator** of a national root (`verify.gov.uk` and the ~195
   equivalents). A commoditised service contract, engineered to expire — see
   [root-level-authorities.md](root-level-authorities.md). The state owns the namespace; the operator
   is a replaceable steward whose off-boarding is deliberately made as easy as its on-boarding. Being
   essential to a government is structured, on purpose, to be temporary.

What survives all three is not a company. It is a **role**: author of a standard the world adopts.

## What openness *does* return to the author

"Uncapturable as equity" is not "worthless to the author." The returns are real; they are just of a
different currency than a moat:

- **Authorship and standards leadership** — being the person who defined the thing everyone builds on.
- **Reputation and influence** — advisory positions, standards-body seats, the credibility that comes
  from having been right early and in public.
- **Impact and legacy** — the fraud actually prevented, the friction actually removed. If the ~600
  use cases work as intended, that is the return, and it is enormous — it just accrues to the world's
  ledger, not the author's bank account.

This is the honest trade the open-protocol lineage has always offered: **give up exclusivity, and in
exchange the thing gets big enough to matter.** Berners-Lee's name is attached to the Web precisely
because he did not try to own it.

## Why saying this out loud is consistent with the project

The whole Live Verify corpus leads with honest limits — every use case has an "honest limit — read
this first" section; the docs refuse to over-claim (Live Verify verifies *authenticity*, not *truth*;
it does not detect deepfakes; an operator is not a sovereign). This doc applies the same discipline to
the project's *own economics*.

The comfortable version — "600 use cases, hundreds of billions in value, therefore a huge business" —
is an over-claim of exactly the kind the rest of the project is built to reject. The honest version
is: **Live Verify is, structurally, a public good.** The value is real and vast; it belongs to the
commons; and the mechanism that delivers it to the commons — openness, state-owned roots, replaceable
operators — is the same mechanism that keeps it from being privately captured.

Naming that plainly is not defeatism. It is the same refusal to sell a story the evidence doesn't
support that makes the protocol itself trustworthy.

## Related

- [root-level-authorities.md](root-level-authorities.md) — why the national-operator role is a
  replaceable service contract, not a moat.
- [comparison-to-isnad.md](comparison-to-isnad.md) — a sibling open project that independently arrived
  at the same provenance-plus-honesty discipline, with the same non-exclusive posture.
- [sovereign-roots.md](sovereign-roots.md) — the state, not any operator, owns the trust root.
- [lets-encrypt-precedent.md](lets-encrypt-precedent.md) — the precedent for value delivered as neutral
  shared infrastructure rather than captured as exclusivity.
