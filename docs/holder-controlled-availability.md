# Holder-Controlled Availability: Letting the Subject Pause Verification

## The problem

Live Verify's status machine is, by default, entirely **issuer-driven**. A university degree returns
`VERIFIED`, `REVOKED`, or `404` depending on what the *issuer* decides — the subject of the
qualification has no say. For most credentials that is correct: the issuer is the authority.

But for a **high-value, long-lived credential the subject holds for decades** — a degree, a
professional licence, an exam result, a background-check clearance — permanent, always-on
verifiability has a privacy cost the subject never chose. A degree is checked at a handful of moments
across a career (a new job, a licence application, a visa). For the years *between* those moments, an
always-answerable endpoint means anyone who obtains the certificate text can *freshly re-confirm it
with the issuer at will* — continuously, silently, forever.

A graduate who is not currently job-hunting might reasonably want to **switch that off** during the
quiet periods, and back on when they next need it — **without having to contact their old university
every time.**

## The feature: a subject-operated start/stop toggle

The pattern is simple: the issuer exposes an **availability toggle** for each subject's record, and
gives the subject an authenticated way to flip it — an app, a portal login, a passkey — that does
**not** require a human at the registrar.

- **Available (default at issue):** the endpoint answers normally (`VERIFIED` / `REVOKED`).
- **Paused by subject:** the endpoint declines to affirm the credential to a live lookup, even for a
  correct hash, until the subject re-enables it.

Crucially, **the toggle changes only the server's willingness to answer. It does not touch the
certificate, its text, or its hash.** The physical degree on the wall, the PDF in an inbox, the scan
in an HR file — all keep their stable, correct hash forever. Nothing the subject holds, and nothing a
past verifier holds, breaks. Only the *live re-confirmation channel* goes quiet and comes back.

The subject is not self-hosting anything. This is **issuer-hosted state the subject controls** through
an authenticated channel the issuer provides. The issuer still owns the record and the endpoint; it
has simply delegated one bit — "answer, or don't" — to the person the record is about.

## Why start/stop, and *not* a holder-rotated salt

A tempting alternative is to put a **salt on the certificate** that the subject can rotate ("give me a
new salt"), so old copies stop verifying. **This does not work for a certificate, and the reason is
worth stating so no one reaches for it.**

A salt only provides privacy when the *displayed* salt and the *server-accepted* salt move together —
the lockstep that an [e-ink badge](../public/e-ink-id-cards.md) maintains because its screen can
re-render on demand. **A paper (or PDF) degree certificate cannot re-render.** The moment the subject
rotates the salt:

- Every already-issued copy — framed on the wall, filed by a past employer, saved as a PDF — now
  carries a **dead hash**. That is not privacy; it is mass breakage of copies people legitimately
  hold, including the subject's own.
- The subject would have to re-issue and redistribute a fresh certificate on every rotation, which is
  absurd for a lifetime credential.

Salt rotation is the right tool for a *re-renderable display in the room* (the e-ink badge), and the
wrong tool for a *static artifact issued once and held for decades*. **Start/stop availability leaves
the hash stable and toggles only the answer — that is the correct shape here.** Reject the
holder-salt approach for certificates.

## The honest limit — read this before calling it "privacy"

This feature must not be over-sold, because the tempting version of the claim is false. **A pause
toggle controls only future, first-time lookups by honest parties who did not keep a copy.** It does
**nothing** against anyone who already has, or later obtains, the plaintext:

- A verifier — or their background-screening supplier — who **lawfully saw the plaintext once and
  stored it** keeps the claim regardless of the toggle. They do not need to re-ask the endpoint.
- Anyone who **photographed or screenshotted** the certificate holds a copy the toggle cannot reach.
- **Hackers** who exfiltrate the issuer's records have the data; a toggle they can see is a toggle they
  ignore.

And the essential framing: **none of this is worse than the pre-existing world.** In the old,
paper-and-phone-call system, a registrar insider, a breached database, or a verifier who kept your
transcript could always redistribute or sell your record. Holder-controlled availability adds **no new
leak surface** — it does not create a copy that did not exist before. It simply declines to serve as
the *ongoing broadcast channel* during the periods the subject switches it off.

So the truthful claim is narrow and real:

> Pausing availability stops your credential being **continuously, freshly re-confirmable by strangers**
> while you are not presenting it. It cannot claw back anything already seen, copied, or stolen — and
> it does not need to, because that exposure was always present and is no greater here than under any
> prior system.

State it that way. A "privacy" claim that implied the subject can retract what a verifier already read
would be exactly the kind of over-promise the rest of this project refuses to make (see
[point-in-time-vs-current.md](point-in-time-vs-current.md) for the sibling honesty principle:
*authentic in the moment* is not the same as *controllable forever*).

## Design subtlety: what "paused" returns

If a paused endpoint returns a bare `404`, it becomes **indistinguishable from "never awarded / fake."**
A subject who merely paused their real degree then looks, to a verifier in the moment, like someone
presenting a fraudulent one. That is a genuine trade-off, and it is a **subject choice**, not a default
the protocol should pick for them:

| Paused response | Privacy | Cost |
|---|---|---|
| **Silent `404`** | Maximal — a verifier cannot even tell a real, paused record exists | The subject may be read as a fraud in the moment; indistinguishable from "no such degree" |
| **Distinct status** (e.g. `PAUSED_BY_SUBJECT`) | Weaker — leaks that a real record exists | Honest: "this is a genuine record the holder has temporarily made unavailable; ask them to re-enable" |

Neither is universally right. Maximal privacy suits a subject who would rather *not exist* to a
casual/unauthorised checker; the distinct status suits a subject mid-process who wants to explain the
gap. The best deployments let the **subject choose per pause**, and default conservatively.

## Who has to build it

- **The issuer** implements the toggle and the subject-facing authenticated control. This is not
  something the subject or a third party can bolt on — it is issuer-hosted state.
- The [witnessing layer](../public/use-cases/university-degrees.md), where present, should record
  availability transitions the same way it records any other status change — an availability pause is a
  status event, auditable after the fact, not a silent deletion.
- The control channel must be **authenticated to the subject** (passkey / verified login). If anyone
  could pause anyone's credential, the toggle becomes a denial-of-service against the subject.

## Where this applies

This is a cross-cutting *pattern*, not a property of one credential. It is most valuable for
high-value, subject-held, long-lived records checked only occasionally:

- University degrees and transcripts ([university-degrees](../public/use-cases/university-degrees.md))
- Professional licences and good-standing status
- Exam and test results
- Background-check / clearance confirmations

It is **not** appropriate where continuous verifiability is the point (a live employment status, a
currently-valid safety certificate, an in-force insurance policy) — pausing those would defeat their
purpose. The distinguishing question is: *is this credential presented at discrete moments (pause fits)
or relied upon continuously (pause breaks it)?*

## Related

- [point-in-time-vs-current.md](point-in-time-vs-current.md) — authentic-in-the-moment is not
  true-forever; the sibling honesty principle behind the "cannot claw back what's seen" limit.
- [e-ink-id-cards.md](../public/e-ink-id-cards.md) — where a *rotating salt* is the right tool,
  precisely because the display re-renders in lockstep; the contrast that explains why salt rotation is
  wrong for a static certificate.
- [university-degrees.md](../public/use-cases/university-degrees.md) — the canonical high-value,
  subject-held credential this pattern is built for.
