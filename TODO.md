# TODO

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

## iOS app should ship a legit Safari Web Extension

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
