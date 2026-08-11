# Export Control and Embargoed Destinations in the Sovereign-Roots List

This note records why the bundled [sovereign-roots list](sovereign-roots.md) should **exclude
embargoed destinations** — and why *adding* one is not a neutral technical act but a regulated one
under UK export law. It is a legal-context note, not legal advice; anyone shipping the list from the UK
who wishes to include a restricted jurisdiction should take their own advice and, where required, seek
a licence. The UK lens applies because the project's maintainer is UK-resident today; at maturity the
list is a multi-vendor, multi-government standards artifact, and the [closing
section](#at-maturity-a-standards-committee-and-many-governments-watching) explains how the scrutiny
distributes across many jurisdictions rather than one.

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

**Article 19 is, in practice, the least applicable of the three to Live Verify — and almost certainly
does not apply.** Live Verify is a document-authenticity checker: it hashes a claim and asks the
issuer's domain whether that hash is one it stands behind. It has **no plausible role in the design,
development, production, or use of a weapon of mass destruction**, and no realistic pathway by which
confirming that a certificate is unaltered contributes to a WMD programme. Article 19 bites on
technology with a credible WMD nexus; a verification protocol has none. It is listed here for
completeness — it is one of the Order's prohibitions and this note surveys them all — not because there
is a genuine WMD end-use concern. The only reason it surfaces at all is the abstract dual-use hook in
the item above (that any use of cryptography *could* attract information-security controls), and even
that is a classification question about the software's category, not a claim that Live Verify has a
WMD use. If the Secretary of State ever issued a specific notification, that notification would govern;
absent one, Article 19 has no purchase here.

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

**The approval need not be maintainer-initiated.** "A licence would be required" does not mean the
maintainer must be the one to go and apply for it. The cleaner real-world path is the reverse: the UK
government could **instruct** the addition — in effect, *"add `xxx.xx` for country `XXXX`"* — and could
handle the diplomatic conversation with that jurisdiction itself. In that case the maintainer is acting
**on the authority of, and at the direction of, UK-gov**, rather than seeking their own permission from
afar. The point is not who initiates the paperwork; it is that adding an embargoed root is a **regulated
act that must be covered by UK-government authority in some form** — a licence applied for, or an
instruction handed down — rather than a unilateral one-line list edit like every unrestricted root.

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
  **technical assistance** beyond mere public dissemination. (Article 19's WMD-end-use limb is a
  further, separate prohibition, but — as noted above — it does not realistically apply to a
  document-verification tool; the operative concern here is the Article 20 promotion point and the
  general prohibition on technical assistance to an embargoed destination, not WMD end-use.)

So the very same maintainer, doing the very same two things (explain the protocol; add the country's
root), is on the right side of the line for Seoul and would likely need a **Secretary of State licence**
for Pyongyang. The distinction is not the *act*; it is the *destination*. Two countries sharing a land
border, one a routine list entry, the other a regulated one.

## Consequence for the list's entry criteria

This adds an explicit **exclusion criterion** to the [sovereign-roots](sovereign-roots.md) governance:

> **Embargoed destinations (per Schedule 4 of the Export Control Order 2008) are excluded from the
> bundled sovereign-roots list by default.** Their absence is deliberate, not an oversight. Including
> one from the UK would need to be covered by UK-government authority — a licence from the Secretary of
> State, or a government instruction to add it — rather than a unilateral list edit, to avoid breaching
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

## At maturity: a standards committee, and many governments watching

Everything above is framed around *today's* reality — a single UK-resident maintainer shipping the
list, so UK export law is the lens that applies to him. That is the right lens now, but it is not the
end state, and the doc would be misleading if it implied the UK is the permanent gatekeeper.

At maturity the sovereign-roots list is not one person's file. It is a **standards-committee artifact**,
maintained the way browser CA root stores actually are — by the platform vendors who ship the
verification technology: **Apple, Google, Microsoft, Samsung, Adobe**, and their peers, sitting on a
standards body that governs the list in the open (the PSL / CA-root-store model the
[sovereign-roots](sovereign-roots.md) doc already points to). Once that is the case:

- **The maintainer's single-jurisdiction export exposure stops being the whole story.** A change is
  made by a multi-vendor body, not by one UK person, so it is not a UK-person's unilateral act in the
  Article 20 sense. Each participating vendor remains answerable to its own home jurisdictions, which is
  a broader and more robust constraint than any one maintainer's.
- **Additions are scrutinised by more governments than just the UK.** A prospective root — especially a
  contested or restricted one — would be reviewed against the export-control, sanctions, and
  national-security regimes of *multiple* states (the US, the EU, and others whose vendors sit on the
  committee), not the UK alone. That is a feature: it makes it far harder for any single government to
  quietly insert, or quietly force the exclusion of, a root — neutrality across many jurisdictions is
  what lets rival adopters co-trust the list at all.
- **The exclusion rule generalises.** "Exclude embargoed destinations, by default, unless covered by
  the relevant government authority" is not a UK-only rule; it is the shape every participating
  jurisdiction's controls impose. A root that is embargoed under several members' regimes simply will
  not clear committee review, whoever proposes it.

So the UK-export-control analysis in this note is best read as the **current, concrete instance** of a
general principle: *adding a sovereign root is a regulated act answerable to real governments, and the
governance is designed to distribute that scrutiny across many of them rather than concentrate it in
one.* The list stays a plain, one-line-per-country artifact; what changes with maturity is that the
authority behind each line is a multi-vendor, multi-government process, not a lone maintainer under a
single flag.

## Related

- [sovereign-roots.md](sovereign-roots.md) — the anchor list, its three-state (anchored / unanchored /
  no-chain) semantics, and PSL-style neutral governance this exclusion criterion feeds into.
- [root-level-authorities.md](root-level-authorities.md) — the operator-lifecycle layer beneath the
  list.
- [authority-chain-spec.md](authority-chain-spec.md) — the `authorizedBy` walk the sovereign roots
  anchor.
