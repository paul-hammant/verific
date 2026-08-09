---
title: "E-Cash / Shardable Bearer Notes (Verification-cum-Transfer)"
category: "Banking & Payments"
volume: "N/A (rejected)"
retention: "N/A (rejected)"
slug: "e-cash-shardable-bearer-notes"
verificationMode: "clip"
tags: ["e-cash", "stored-value", "bearer-instrument", "central-bank", "cbdc", "payments", "double-spend", "rejected", "out-of-scope"]
furtherDerivations: 0
---

## The idea

A central bank issues a verifiable **bearer note** — say a "$100 note" as a signed, hashable object.
The holder could **shard** it in a single self-transaction: a $100 note becomes a $33.33 payment to a
merchant and a $66.67 note retained as change. Conversely, several smaller notes could be **combined**
back into one. The central bank is the verification **root**: a `vfy:` lookup would confirm a note's
current value and unspent status, and — to prevent the same note being spent twice — issue a **new
salt** on each spend, exactly the burn-on-verify lockstep an
[e-ink badge](../e-ink-id-cards.md) uses so a photographed value freezes and dies. A person's
ordinary bank account stays separate; you would **load** notes from your account, spend them, and
settle back. A transaction limit (e.g. **$10**) might keep it in a micro-payments niche.

It is a genuinely interesting design, and it draws directly on mechanisms Live Verify already has
(hash-committed claims, salt rotation on use, a sovereign root). That is precisely why it is worth
writing down *why it sits outside* Live Verify rather than inside it.

## Why this is out of scope for Live Verify

**Live Verify verifies claims; it does not move value.** Every other use case in this project is
**read-only**: the verifier asks "is this authentic?" and nothing the verifier does changes the
holder's assets or the issuer's ledger in a way that transfers ownership. This idea inverts that — the
act of verifying *is* the act of paying. The moment "verify" also means "debit $33.33 and mint $66.67
in change," you have left verification and entered **payments**.

Concretely, the gaps are structural rather than cosmetic:

- **It needs a verb Live Verify deliberately doesn't have.** You reached for `tfr:` for a reason:
  `vfy:` confirms state, it does not mutate balances or move ownership. A transfer verb would make the
  root a **real-time transaction processor** that must guarantee settlement, ordering, and finality —
  a different system with different guarantees, not a verification endpoint that answers a GET.
- **Salt-on-spend is anti-double-spend, and that tells you what you're building.** Rotating the salt
  on every spend is a lovely mechanic, but double-spend prevention *is the hard problem of a payment
  network*, not of a claim verifier. Needing it is the signal that this is settlement infrastructure
  wearing a verification costume.
- **Bearer value carries obligations a verifier does not.** Anonymous or semi-anonymous transferable
  value pulls in AML/KYC, custody, reversibility, consumer-protection, and central-bank-operational
  duties that a read-only verification protocol neither has nor should acquire.

None of this makes the idea bad. It makes it a **payments protocol** — and Live Verify's whole value
proposition is being *not* a payments protocol: a boring GET that moves no money and holds no float.

## The history rhymes, gently

There was a wave of **stored-value / electronic-purse** systems from roughly the mid-1990s into the
2000s — Mondex, Visa Cash, and peers (the
[stored-value card](https://en.wikipedia.org/wiki/Stored-value_card) lineage). Most of the
general-purpose, open-loop ones wound down. The commonly cited reasons are worth remembering because
they are the same reasons here:

- **Offline double-spend and tamper risk.** Where value lived on a card chip and could move
  card-to-card without a central ledger, breaking the chip's tamper resistance meant minting money.
- **AML and anonymity friction.** Genuinely anonymous transferable value is hard to reconcile with
  financial-crime rules; the survivors (transit cards like Octopus, closed-loop gift value) succeeded
  by being **low-value, closed-loop, and de-anonymised** — i.e. by *not* being open bearer e-cash.
- **Incumbent rails and network effects.** Debit and credit already worked, were everywhere, and had
  the merchant and consumer network locked in. A challenger had to be dramatically cheaper *and* clear
  a standing-start adoption problem.

Your own launch conditions restate these honestly: it would only make sense if it **beat debit
interchange** and could roll out despite the major card networks — who may **lobby (legally) against
it** rather than simply ignore it — and the **$10 cap** you floated is itself the tell. A cap that low
concedes the only comfortable niche is micro-payments, which is exactly the low-value, closed-loop
corner where these systems have historically survived by ceasing to be open e-cash and becoming
something more like a transit purse.

## The honest boundary: value-*adjacent* actions are fine; moving value is not

Rejecting "verification *is* the payment" does **not** mean Live Verify avoids anything touching money.
It already supports [post-verification actions](../../docs/post-verification-actions.md): the *act* of
verifying can legitimately **trigger** a follow-up.

The clean example is expenses. A business traveller verifies a hotel receipt or a taxi fare; on that
**first successful verification**, the response could offer to push the receipt straight into an
expenses/accounting system — "add to your July expense report," a POST form or deep link to the
finance tool. That is genuinely useful and squarely in scope, because:

- the money already moved elsewhere (the card was charged); Live Verify is not moving it;
- what's happening is a **claim being confirmed and then handed to another system**, not value being
  transferred by the verify step itself;
- the verification remains a read-only GET; the value-adjacent action is a separate, clearly-labelled
  follow-up the verifier chooses to take.

That is the line. **Live Verify can confirm a receipt and then trigger something in a finance system.
It should not be the thing that debits an account or mints change.** The e-cash idea crosses that line;
the expenses example stays the right side of it — and marks out a real, in-scope area to develop later.

## Verdict

**Rejected — out of scope, not unsound.** Shardable bearer e-cash is a payments/transfer system, and
Live Verify is deliberately a verification system that moves no value and holds no float. Building it
would require transfer semantics the protocol intentionally omits, would turn the root into a
real-time settlement processor, and would re-inherit the double-spend, AML, and network-adoption
problems that shaped the earlier stored-value era. The salvageable, in-scope thread is the opposite
direction: **value-adjacent post-verification actions** (e.g. auto-filing a verified receipt into an
expenses system), where verification stays read-only and merely *triggers* the next step.

## Related

- [Post-Verification Actions](../../docs/post-verification-actions.md) — the in-scope mechanism for
  value-adjacent follow-ups (the expenses example above).
- [E-Ink ID Cards](../e-ink-id-cards.md) — where salt-rotation-on-use (burn-on-verify) *is* the
  right tool, for anti-replay of a **credential**, not anti-double-spend of **money**.
- [Gift Card Redemption Receipts](../use-cases/gift-card-redemption-receipts.md) — a closed-loop,
  value-adjacent case that stays on the verification side of the line.
