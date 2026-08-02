# Root-Level Authorities: The Operator Lifecycle, and Why Off-Boarding Must Mirror On-Boarding

## What this doc is about

[sovereign-roots.md](sovereign-roots.md) specifies the *anchor list* — the data artifact an app holds
so it can tell whether a chain terminates at a genuine sovereign root. This doc is about the layer
underneath that: **the institutional relationship between a government and whoever operates its
root-level verification service** — the entity running `verify.gov.uk`, `verify.gov.au`,
`verificar.gob.mx`, and the ~195 national equivalents.

That operator is a **supplier**, not a sovereign. The namespace belongs to the state; the operator
delivers a service against it. This distinction is the whole point of the doc, because it determines
what happens when the relationship ends — and it *will* end, for every operator, in every country,
eventually.

## The lifecycle looks the same in every country

Whatever the flag, a root-verification operator moves through the same arc. This is not a risk to
mitigate; it is the designed-in shape of supplying critical infrastructure to a state.

1. **On-boarding.** A government appoints (or procures) an operator to run root-level verification for
   its namespace. Early on the operator is close to the centre — briefing the ministry, shaping the
   rollout, treated as indispensable.
2. **Normalisation.** The service becomes business-as-usual. The operator now reports to officials,
   not principals. It is a line item in a departmental budget.
3. **Distancing.** Ownership of the *standard* moves to a committee or oversight body. The operator
   becomes one of N possible suppliers of a now-commoditised function. Procurement rules actively
   require that it be replaceable.
4. **Off-boarding.** The contract is re-competed, insourced (as the UK did moving from GOV.UK Verify
   to One Login), or handed to a successor. The operator exits.

**The state engineers step 4 to be possible from the moment step 1 begins** — precisely so that no
private operator can hold a national trust function hostage. A design that treats the operator as
permanent has misunderstood the relationship. The operator is always leaving; the only question is
whether leaving is clean.

## The core principle: off-boarding must mirror on-boarding

> **Off-boarding from any operator should be as easy as on-boarding was — and its fee structure
> should match.** Whatever a government paid, in money and in effort, to *stand up* root-level
> verification with an operator, it should pay no more to *stand it down* and move to another.

This is a **procurement and sovereignty requirement**, not a courtesy. If exit is harder or costlier
than entry, the operator has acquired de-facto power the state never granted it — the ability to make
switching painful is the ability to extract rent, and that is exactly the single-gatekeeper problem
the rest of this project is built to prevent (see [sovereign-roots.md](sovereign-roots.md) on
PSL-style, no-anointed-authority governance).

Concretely, symmetry means:

- **No exit fee that exceeds entry cost.** If onboarding is a fixed fee, offboarding is the same fixed
  fee — not a percentage of anything, not a penalty, not a "migration services" upcharge that dwarfs
  the original engagement. If onboarding was free, offboarding is free.
- **Fee structure mirrored, not just fee level.** Per-verification pricing on the way in means
  per-verification pricing on the way out, with the meter stopping when service stops. No minimum
  terms that outlive the relationship, no take-or-pay tail.
- **Data and namespace control return to the state, in full, at no charge.** The operator holds the
  namespace *on behalf of* the government. Handing back the domain configuration, the issuer registry,
  the authority-chain records, and the operational runbooks is a return of the state's own property,
  not a paid deliverable.
- **A standing, tested exit runbook.** The ability to leave is verified periodically, not discovered
  during a crisis. Exit is a designed capability with a rehearsal, like a disaster-recovery drill.

## Why the protocol's openness makes this achievable

The reason symmetric off-boarding is *possible* here — and is often impossible with proprietary
government IT — is that Live Verify is an open protocol with a reference implementation.

- **The successor operator can stand up an identical service** because the spec, the endpoint
  contract, and the authority-chain semantics are public (see
  [authority-chain-spec.md](authority-chain-spec.md)). There is no proprietary format to reverse-
  engineer and no vendor whose cooperation is required to migrate.
- **What transfers is data and namespace control, not a black box.** The state hands the new operator
  the same public artifacts the old one used. Continuity of verification is a DNS/endpoint cutover,
  not a re-platforming.
- **The anchor list doesn't change when the operator changes.** Apps anchor to `*.gov.uk` (or the
  national equivalent), which the *state* controls — not to the operator's corporate identity. An
  operator handover is invisible to every relying party, because the trust root was never the
  operator in the first place. This is the technical fact that makes clean exit possible: **relying
  parties trust the namespace, so swapping who runs it behind that namespace breaks nothing.**

## What this means for an operator (said plainly)

Running a national root-verification service is a **service contract, not a moat.** The operator
never holds the authority to admit or exclude issuers — that is a sovereign function that cannot be
delegated durably. The operator's revenue is delivery revenue; its tenure is finite by design; and
its exit terms should, by this principle, cost no more than its entry terms.

Stating this openly is a feature, in the same spirit as the rest of the project's honest-limit
posture. An operator model that quietly relied on painful switching costs would be building the exact
lock-in the protocol exists to dissolve. The honest position is: **the operator is a replaceable
steward of a namespace the public owns, and the terms of replacement are fixed, symmetric, and known
in advance in all ~195 jurisdictions that run a root.**

## Related

- [sovereign-roots.md](sovereign-roots.md) — the anchor list the apps hold; why the trust root is the
  state's namespace, not any operator.
- [authority-chain-spec.md](authority-chain-spec.md) — the `authorizedBy` walk from issuer up to a
  sovereign root that an operator serves but does not own.
- [meta-governance.md](meta-governance.md) — the ~195 national roots and the treaty-based IGO roots.
- [lets-encrypt-precedent.md](lets-encrypt-precedent.md) — neutral-steward governance and why
  shared trust infrastructure must not be captured by a single operator.
