# Public-Suffix Operator Disclaimer

**Status:** proposal. Not implemented in any client.

A way for the operator of a multi-tenant namespace — GitHub for `github.io`, Automattic for
`wordpress.com`, Cloudflare for `pages.dev` — to say, in the verifier's UI, that it does not stand
behind a claim published by one of its tenants.

## The problem

`foo.github.io` is a tenancy. Anyone can have one, and the name they get to choose sits directly
beside a name people recognise. A verifier that displays the issuer domain — as every Live Verify
client does, deliberately, because the human reading the domain is half of the trust decision — is
therefore displaying GitHub's name next to a claim GitHub has never seen.

We already blunt the worst of this. `extractDomainAuthority()` collapses every `*.github.io` to
`github.io` precisely so that `edinburgh.ac.uk--___dir.github.io` cannot present itself as
Edinburgh (see `__tests__/domain-authority.test.js`), and the client emphasises the registrable
domain within the full hostname so the reader sees where accountability actually sits. But the
result of doing that well is that GitHub's name is the emphasised one. We have made the display
honest about *which* party is accountable, and that party has had no say.

This is the mirror image of `authorizedBy`. There, an issuer names a party that endorses it. Here,
a namespace operator gets to disclaim tenants who are trading on its name without asking.

## The mechanism

When the authority domain is a subdomain of a **listed** public suffix, the client fetches the
operator's own metadata from the suffix apex:

```
GET https://github.io/verification-meta.json
```

If it returns 200 with a disclaimer field, the client displays that text alongside the verdict. If
it returns anything else, the operator has said nothing and the client displays nothing extra.

```json
{
  "namespaceDisclaimer": {
    "en": "Verification above is not endorsed by GitHub, Inc.",
    "de": "Die obige Verifizierung wird von GitHub, Inc. nicht unterstützt.",
    "fr": "La vérification ci-dessus n'est pas approuvée par GitHub, Inc."
  }
}
```

The file is served from the suffix itself over TLS, so it authentically represents the operator —
the same property that makes an issuer's own `verification-meta.json` trustworthy.

### When it fires

Only when `psl.parse(host).listed && host !== suffix`. An ordinary registrable domain never pays
for this lookup.

Note what narrowed the scope: the displayed authority now comes from the **verify: line**, never
from whichever host served the hash file (see *Authority display* below). So an issuer at
`paulhammant.com` who parks hash files on GitHub Pages does not trigger a GitHub disclaimer —
GitHub's name is not being displayed. It fires only where a document actually names a tenancy, which
is exactly where the brand risk is.

### Exactly one location

One URL. No `www.` retry, no `.well-known` alternative, no DNS TXT fallback, no ladder.

**Never `www.`.** The clients retry issuer metadata with a `www.` prefix (see
`VerificationClient.addWwwPrefix`) because `www.example.com` and `example.com` are the same party,
and issuers do print `verify:example.com/c` while serving only `www`. That reasoning inverts on a
public suffix: `www.github.io` is not GitHub, it is the Pages site of whoever registered the repo
named `www`. Extending the retry here by analogy would hand any tenant who grabs that name the
ability to publish statements attributed to the operator, across the entire namespace.

Large operators do reserve obvious names, and GitHub very likely reserves this one. The rule cannot
depend on that: the PSL has thousands of entries, including a long tail of regional and free-hosting
namespaces whose reservation policies we do not know and cannot check.

The decisive argument is simpler, though. The `www.` retry exists to absorb *human authoring
variance* in a printed `verify:` line. A public suffix is never typed by anyone — the client derives
it from the PSL, exactly, every time. There is no variance to absorb, so the retry buys nothing at
any price.

**One location is also what makes absence meaningful.** If the spec allowed HTTP *or* DNS TXT, then
"no file at the apex" would stop meaning "the operator has said nothing" and start meaning "…or they
used the other mechanism and we did not look". Every client would then have to perform both lookups
on every verification to be correct. With a single canonical path, a 404 is an answer.

This assumes operators can serve a specific file at their own apex. For the vendors this concerns —
GitHub, Google, Automattic, Cloudflare — that is a trivial requirement, and designing around a
hypothetical operator too tangled in legacy A/CNAME arrangements to manage it would cost every
client a second lookup forever.

### Caching

These files change approximately never. Cache aggressively, respect `Cache-Control`, and treat a
stale copy as fine. This lookup must not add latency to the common path.

## Disclaim, do not endorse

The field should carry disclaimers only, at least initially.

The same channel could obviously carry positive statements — "this tenant is a verified GitHub
partner" — but that quietly becomes a second endorsement path competing with `authorizedBy`, with
none of its chain semantics, no `authorizedFrom`/`authorizedTo` bounds, and no way to walk it. The
two powers are not symmetric: disclaiming is an operator defending its own name, which needs no
ceremony; endorsing is a trust assertion about someone else, which has one.

## What it does not solve

- **It does not make the tenant untrustworthy.** A disclaimer says GitHub has not vouched for this,
  which was already true and merely unstated. A self-verified claim on a tenancy is still
  self-verified; this adds the namespace operator's non-involvement to what the reader knows.
- **It does not stop impersonation.** A tenant named `edinburgh.ac.uk--___dir` is still free to pick
  that name. The domain-authority collapse and the registrable-domain emphasis are what address
  that; this is about the operator's name, not the impersonated third party's.
- **It cannot be compelled.** An operator that publishes nothing is indistinguishable from one that
  has never heard of Live Verify. That is the honest default and the reason absence displays as
  nothing rather than as reassurance.

## It applies to us

Our own training pages carry `verify:live-verify.github.io/live-verify/c`, so Live Verify's demo
endpoints would display a GitHub disclaimer if GitHub published one. That is uncomfortable and
correct — a fair thing for GitHub to say about our demos, and a good test of whether we believe the
mechanism.

## Authority display (already shipped)

Related, and the change that narrows this proposal's scope: the domain shown to a reader is the one
the **document named on its verify: line**, never the host that served the hash file. `hashesHostedAt`
is a hosting hint, not a delegation of authority — an issuer may put hash files behind a provider for
a couple of years and then bring them in-house, and neither the verification nor what the reader sees
should change. Where the bytes live is infrastructure, like a CDN; nobody displays "served by Akamai"
beside a bank's name.

## Open questions

- **Field name.** `namespaceDisclaimer` reuses the issuer-meta filename, which is elegant — one
  convention, two speakers — but the name must make clear who is speaking, since the same file also
  functions as ordinary issuer metadata if anyone publishes a claim under `verify:github.io/...`
  directly.
- **Localisation shape.** A locale map (above) is self-contained and cacheable but grows the file;
  a URL to fetch per-locale text adds a lookup and a failure mode. The locale map is probably right
  for text this short, with a documented fallback to `en`.
- **Display placement.** Alongside the verdict, or in the authority row beneath it? It is not a
  verdict modifier — the claim's verification is unaffected — so probably the latter.
- **Adoption.** This is worth nothing until an operator publishes one. Worth approaching GitHub with
  a working implementation rather than a proposal.
