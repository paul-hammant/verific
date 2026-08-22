# TODO

## Clients: implement `endorsementLabel` display precedence

Spec added in `docs/verification-meta-schemas.md` (the `endorsementLabel` locale-map). Not yet wired
into any client. When implementing:
- Resolve the displayed chain verb as: issuer `endorsementLabel[locale]` (if present) → client's own
  locale string ("Endorsed by" / "Befürwortet durch" / …) → `en` fallback. Never show the raw field name.
- It is a **label swap only** — must not change the verdict, the chain walk, or which meta field is read.
- Read the endorsement field as `meta.endorsedBy ?? meta.authorizedBy` (the field-name migration is a
  separate, back-compat concern; `authorizedBy` remains the honoured wire name until/unless that
  migration happens).
- Applies to browser extension, iOS, Safari extension, Android — via the canonical logic + `sync-shared`
  where relevant.

## iOS: Rich verification payload support

Same gap as Android. `VerificationClient.swift` parses for "verified"/"VERIFIED" but
doesn't extract or surface extra JSON fields.

Changes needed:
- `VerificationClient.verify()` — when response is JSON with `status: "verified"`, also
  extract `headshot`, `message`, and other fields into the result
- `VerificationResult` enum — add associated payload data
- `ResultView.swift` — render headshot (base64 data URI → UIImage) and message text
- Match the Chrome extension's layout

## Browser extension ships auto-generated copies of canonical JS that can go stale

The browser extension (`apps/browser-extension/shared/`) contains auto-generated copies
of `public/normalize.js`, `public/app-logic.js`, and `public/domain-authority.js`. These
copies have ES module transformations applied by `scripts/sync-shared.js`. If canonical
files in `public/` change without running `npm run sync-shared`, the **shipped extension**
uses stale logic — this is a production bug, not just a test problem.

**Mitigation:** Run `npm run sync-shared` after changing any file in `public/` and commit
the result. Symlinks aren't feasible because the sync applies ES module transformations.
Full CI is too heavyweight for this project, so this is a manual discipline step.

## Browser extension test failures: ESM import in Jest

3 test suites fail because `apps/browser-extension/shared/verify.js` uses ES module `import`
syntax, which Jest's default CommonJS `require()` cannot load. Affected file:
`__tests__/browser-extension.test.js` (the `verify.js` imports at line 33).

The 5 failing tests are in the `extractVerificationUrl`, `extractCertText`,
`buildVerificationUrl`, `extractDomain`, and `fetchVerificationMeta` describe blocks.

**Fix options:**
- Configure Jest with `transform` or `extensionsToTreatAsEsm` for the shared modules
- Add a CJS wrapper/re-export for the shared verify.js
- Move browser-extension tests to a separate Jest project with ESM support

## iOS app should ship a legit Safari Web Extension — DONE (iOS host)

Shipped as the `LiveVerifySafari` app-extension target inside `LiveVerify.xcodeproj`, embedded
in the camera app under `PlugIns/`. Sources in `apps/ios/LiveVerify/SafariExtension/`.

- `scripts/sync-shared.js` gained a second target, so `WebExtension/shared/` is generated from
  canonical `public/` and is **byte-identical** to `apps/browser-extension/shared/`. Not a fork.
- `SafariWebExtensionHandler.swift` is deliberately inert — routing any verification through
  native code would fork the logic.
- **iOS Safari has no `contextMenus`, `notifications` or `commands` APIs** (macOS Safari does).
  So the right-click "Verify this claim" gesture cannot exist here. The flow is: select text →
  open Live Verify from the ᴀA/extensions menu → the popup reads the selection via a content
  script and verifies it. Parity of function, not of gesture.
- The content script remembers the last non-empty selection, because opening the popup can
  collapse the visible one.
- Two Xcode gotchas worth knowing, both fixed here: `ENABLE_DEBUG_DYLIB = NO` is required or the
  preview dylib lands unsigned inside the `.appex`; and the web-extension files must sit at the
  bundle **root**, not in a folder called `Resources` — that name makes codesign mis-walk a
  shallow iOS bundle as a deep macOS one and fail with "code object is not signed at all".

**Verified end-to-end in the iOS Simulator** (9 Aug 2026): enabled in Settings → Apps → Safari →
Extensions, selected a claim on a training page, and the popup verified it against the issuer.

**Blocked on the physical test iPhone**, and NOT yet diagnosed: Safari lists the extension but the
enable toggle is greyed in both Settings and Safari's Manage Extensions, and *every* extension is
greyed, not just ours — which points to a device-level restriction rather than a bug in our code.
Despite extensive fiddling and searching we have **not found how to enable it**. One observation on
that device: Screen Time → Content & Privacy Restrictions appears enforced and bounces back to "on"
when turned off, which *suggests* a configuration-profile / supervision / Family-Sharing policy — but
that is a hypothesis, not a confirmed cause; the actual setting responsible is still unidentified.
**Use the Simulator to test this extension** until on-device enablement is cracked. (Next things to
try: check for an MDM/config profile in Settings → General → VPN & Device Management; a different,
unrestricted iPhone; and whether the extension enables on a fresh device with no Screen Time set.)

Not yet done: `verifiable-text` marker auto-scanning, history, settings and i18n, all of which
the Chrome extension has.

## Old notes: iOS app should ship a legit Safari Web Extension

We already have the Live Verify iOS app (`apps/ios/LiveVerify/`). Expand it to also ship a
**real Safari Web Extension** that gives Safari the same in-page text verification the
`apps/browser-extension/` extension gives Chrome / Edge / Firefox: select text containing a
`verify:`/`vfy:` line, invoke from the context menu, hash it, and verify against the issuer
endpoint — showing the same result UI.

Notes:
- Safari Web Extensions are packaged **inside** a host app (iOS and/or macOS), which is why this
  belongs with the existing iOS app rather than as a standalone folder. The app becomes the
  container that vends the extension.
- **Reuse the canonical JS, don't fork it.** The browser extension already runs synced copies of
  `public/normalize.js`, `public/app-logic.js`, `public/domain-authority.js` via
  `scripts/sync-shared.js`. The Safari extension must consume the same synced `shared/` output so its
  normalization/hashing stays byte-identical to every other client (see the "auto-generated copies can
  go stale" item above — same discipline applies).
- Aim for parity with the browser extension's flow and result layout, not the iOS camera/OCR pipeline
  — this is the text-selection path, not capture.
- Cross-platform manifest: Safari supports MV3 web extensions, but validate the `manifest.json` and
  context-menu (`menus`/`contextMenus`) APIs against Safari's supported subset.

## New Mac app to host the macOS-Safari extension

Safari on macOS is a **separate target** from Safari on iOS: the iOS extension is vended by the iOS
app, and desktop Safari needs its own macOS host app to vend the same extension. So alongside the iOS
work above, add a **new Mac (AppKit/SwiftUI) app** whose job is to package and enable the Live Verify
Safari Web Extension for desktop Safari — same text-selection verification flow as the browser
extension.

Notes:
- Xcode can generate both host apps from one Safari Web Extension via a shared extension target; the
  goal is **one extension, two hosts** (iOS app + Mac app), not two separate extension codebases.
- The Mac app can be minimal — a container that installs/enables the extension and links to help —
  unless we later want a desktop verification UI beyond Safari.
- Same reuse rule: the macOS extension consumes the synced `shared/` JS (`scripts/sync-shared.js`), so
  hashing/normalization stays byte-identical across iOS, macOS, and the Chrome/Edge/Firefox extension.
- Distribution: a macOS Safari extension ships through the Mac App Store (or a notarized/signed build)
  — factor signing/notarization into the plan.
