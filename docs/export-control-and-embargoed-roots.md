# Export Control and Embargoed Destinations in the Sovereign-Roots List

This note records why the bundled [sovereign-roots list](sovereign-roots.md) should **exclude
embargoed destinations** — and why *adding* one is not a neutral technical act but a regulated one
under UK export law. It is a legal-context note, not legal advice; anyone shipping the list from the UK
who wishes to include a restricted jurisdiction should take their own advice and, where required, seek
a licence.

The governing instrument is the UK **Export Control Order 2008**.

- **Original, complete text (LLM-readable):**
  [Export_Control_Order_2008.pdf on Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Export_Control_Order_2008.pdf).
- The UK government publishes the same Order, but in a form that has been split and restructured across
  many pages in a way that cannot be fed to an LLM as a single document. The Wikimedia Commons PDF is
  linked here precisely because it is the whole Order in one machine-readable file.

## Why the sovereign-roots list is where export control bites

The sovereign-roots list is the mechanism that lets a client show a **GREEN (Anchored)** status and
**name the jurisdiction** — for example, "Anchored to [country] government." That naming is the point
of the list (see [sovereign-roots.md](sovereign-roots.md): the jurisdiction is the useful payload, not
a bare checkmark).

That is also exactly why adding an *embargoed* destination is different in kind from adding an ordinary
one. It is not merely recording a fact; it is building, into the shipped software, an affirmative
statement that a restricted regime's namespace is a recognised, legitimate root of trust.

## Embargoed destinations under the Order

The Order identifies certain destinations as subject to the strictest controls.

- **Schedule 4, Part 1** lists **Iran** and the **Democratic People's Republic of Korea (North
  Korea)** as embargoed destinations, with *no exception for transit*.
- **Schedule 4, Part 2** lists further destinations (for example **Armenia**, **Azerbaijan**, and
  **Sudan**) as embargoed and subject to transit controls for military goods.

The precise, current lists live in the Order itself; the point here is that a defined set of
destinations carries controls that ordinary sovereign roots do not.

## The relevant prohibitions

**Article 20 — acts calculated to promote supply.** Under Article 20, a UK person is prohibited from
performing any act *"calculated to promote the supply or delivery"* of controlled goods to an embargoed
destination.

- **Anchoring reads as promotion.** Because adding a root produces a GREEN "Anchored to [country]
  government" result, adding an embargoed destination could be interpreted as an act that promotes the
  use and apparent *legitimacy* of the software within that jurisdiction. Excluding it is the
  conservative reading.

**Dual-use / information-security classification.** If Live Verify were classified as a UK-controlled
**dual-use** item or an **information-security item** — plausibly by virtue of its use of **SHA-256
cryptography** — stricter rules apply to its movement to destinations such as Iran.

**Article 19 — WMD end-use.** Under Article 19, providing *"technical assistance"* (technical support
related to the use or development of the technology) is prohibited where there is awareness, or
notification from the Secretary of State, that the technology is intended for **WMD purposes**.
Restricted regimes are higher-risk candidates for such notifications.

## The public-domain exception — and its limit

As an open-source project, the *general code* of Live Verify is protected by **Article 18**, under
which the export controls do not prohibit the transfer of technology that is **"in the public domain."**

The limit is the distinction between **general dissemination** and **specific integration**:

- Publishing the general code openly is public-domain transfer, and permitted.
- Deliberately modifying the software to **recognise and validate the authority of an embargoed
  state** — adding that state's root to the trust-anchor list — could be viewed as **technical
  assistance or promotion** that goes beyond mere public dissemination, and therefore outside the
  Article 18 shelter.

In other words, the public-domain exception protects *shipping the mechanism*; it does not obviously
protect *pointing the mechanism at a specific embargoed regime*.

## Would UK government approval be required to include one?

Yes — most likely a **UK licence** would be needed.

- A **UK licence** is a written authorisation from the **Secretary of State** permitting an act that
  would otherwise be prohibited.
- To officially include an embargoed destination in the bundled trust-anchor list, a licence
  application would likely be required. The Secretary of State may grant, refuse, or hear appeals on
  such licences on national-security and international-obligation grounds.
- Where an act is performed under a **general licence**, the actor must **register with the Secretary
  of State within 30 days** of the first act under that licence.

## A worked example: the two Koreas

The line between permitted and controlled is easiest to see by contrasting two neighbouring
jurisdictions — one unrestricted, one on Schedule 4.

Take the maintainer of this project, **Paul Hammant, resident in the UK**, as the person performing the
acts.

**South Korea — permitted, no UK-government conversation needed.** South Korea is not an embargoed
destination. Paul could, from the UK, answer questions about Live Verify put to him by the South Korean
government, provide ordinary technical explanation of how the protocol works, and go on to **add South
Korea's chosen root to the bundled sovereign-roots list** — say `승인.go.kr` (승인 means "approval"),
or whatever namespace they nominate — so that South Korean issuers anchor GREEN as "Anchored to South Korea government." None
of that requires a licence or any dialogue with the UK government. It is ordinary open-source
dissemination plus a one-line, ceremony-free list entry, exactly as the [sovereign-roots
list](sovereign-roots.md) is designed to work.

**North Korea — its land neighbour — not permitted the same way.** The Democratic People's Republic of
Korea sits in **Schedule 4, Part 1** (embargoed, no exception for transit). The *same acts* pointed at
North Korea change character:

- **Adding `…` under a DPRK government namespace to the list** would produce a GREEN "Anchored to North
  Korea government" result — an affirmative endorsement built into the shipped software, which under
  **Article 20** could read as an act *calculated to promote* the technology's use and legitimacy in an
  embargoed destination.
- **Answering the DPRK government's questions and providing tailored technical support** could amount to
  **technical assistance** beyond mere public dissemination, and — given the WMD-risk profile of the
  regime — engages **Article 19**.

So the very same maintainer, doing the very same two things (explain the protocol; add the country's
root), is on the right side of the line for Seoul and would likely need a **Secretary of State licence**
for Pyongyang. The distinction is not the *act*; it is the *destination*. Two countries sharing a land
border, one a routine list entry, the other a regulated one.

## Consequence for the list's entry criteria

This adds an explicit **exclusion criterion** to the [sovereign-roots](sovereign-roots.md) governance:

> **Embargoed destinations (per Schedule 4 of the Export Control Order 2008) are excluded from the
> bundled sovereign-roots list by default.** Their absence is deliberate, not an oversight. Including
> one from the UK would likely require a UK licence from the Secretary of State, to avoid breaching
> trade controls or the prohibition on promoting controlled technology to restricted regimes.

This sits comfortably beside the list's existing design. A chain that terminates at an *unlisted* root
is not painted red — it renders **amber / unanchored**: "this chain ends at a domain not known to be a
sovereign root — judge it yourself." So excluding an embargoed destination does not break verification
for anyone; a claim from such a jurisdiction still verifies against its issuer's domain if the issuer
stands behind it, it simply does not receive the green "Anchored to [country] government" endorsement
that the list confers. Verification and anchoring remain two separate signals.

Maintaining neutrality by excluding embargoed destinations therefore aligns with Schedule 4 while
preserving the protocol's honest-limit posture: the app declines to *vouch* for a root it is not
lawfully permitted to vouch for, rather than pretending the jurisdiction does not exist.

## Related

- [sovereign-roots.md](sovereign-roots.md) — the anchor list, its three-state (anchored / unanchored /
  no-chain) semantics, and PSL-style neutral governance this exclusion criterion feeds into.
- [root-level-authorities.md](root-level-authorities.md) — the operator-lifecycle layer beneath the
  list.
- [authority-chain-spec.md](authority-chain-spec.md) — the `authorizedBy` walk the sovereign roots
  anchor.
