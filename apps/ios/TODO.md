1. ~~Add `X-Verification-URLs` header to authority chain walk requests~~ — DONE
   (`Pipeline/VerificationClient.swift`: `chainRequest(url:priorUrls:)`, threaded through
   `checkAuthorization(meta:metaUrl:claimUrl:)` and `walkAuthorizationChain(...chainUrls:)`).
   Mirrors `public/app-logic.js`; header omitted entirely when there are no prior URLs.
   Covered by `VerificationClientTests` — header content, growth up the chain, and omission.
