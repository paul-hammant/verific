# LLM Context: OCR-to-Hash Verification System

## Project Overview

This is a **100% client-side web application** for verifying physical documents using OCR, text normalization, and SHA-256 hashing. It implements the concept from Paul Hammant's blog post: [OCR-to-Hash: A Simple Audit Trail for Physical Documents](https://paulhammant.com/2023/01/17/ocr-to-hash-simple-audit-trail-for-physical-documents/).

## Key Design Decisions

### 1. No Backend Server Required
- **Initial approach**: Built with Express backend + in-memory hash database
- **Final approach**: Pure client-side verification against URLs printed on documents
- **Why**: Can deploy to GitHub Pages for free, works offline, no infrastructure needed

### 2. URL-Based Verification (Not Local Database)
The document itself contains:
- Certification text within registration marks
- Verification URL printed below the text (e.g., `https://intertek.com/certifications/{HASH}`)

The app:
1. OCRs everything
2. Extracts the URL from OCR text
3. Removes URL line from certification text
4. Normalizes remaining text
5. Computes SHA-256 hash
6. **Checks if computed hash appears in the claimed URL**
7. Shows green "VERIFIED" or red "FAILS VERIFICATION" overlay on camera

### 3. No Hardcoded Hashes
- We do **NOT** maintain a local database of valid hashes
- Trust model: The organization that controls the domain (e.g., `intertek.com`) is trusted
- If hash matches URL → verified
- If hash doesn't match URL → fails

## File Structure

```
verific/
├── public/                    # Deploy this folder to GitHub Pages
│   ├── index.html            # Camera UI with registration marks
│   ├── styles.css            # Responsive design, mobile-first
│   └── app-url-based.js      # Main app logic (OCR, normalize, hash, verify)
│
├── build-hashes.js           # Helper to generate test hashes (optional)
├── server.js                 # Express server (NOT needed for deployment)
├── ocr-hash.test.js          # Jest test suite (17 tests, all passing)
├── webpack.config.js         # Optional bundling config (not currently used)
│
├── .github/workflows/
│   └── deploy.yml            # CI/CD: runs tests, deploys to GitHub Pages
│
├── README.md                 # User-facing documentation
├── TESTING.md                # Test documentation
├── GITHUB_PAGES.md          # Deployment guide
└── LLM.md                    # This file
```

## Core Logic

### Text Normalization Rules (per blog post)
```javascript
function normalizeText(text) {
    const lines = text.split('\n');
    const normalizedLines = lines.map(line => {
        line = line.replace(/^\s+/, '');    // Remove leading spaces
        line = line.replace(/\s+$/, '');    // Remove trailing spaces
        line = line.replace(/\s+/g, ' ');   // Collapse multiple spaces
        return line;
    });
    return normalizedLines.join('\n');      // Preserve blank lines
}
```

### SHA-256 Hashing
Uses Web Crypto API (built into browsers):
```javascript
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Verification Logic (app-url-based.js:202-260)
```javascript
async function verifyAgainstClaimedUrl(claimedUrl, computedHash) {
    if (!claimedUrl.includes(computedHash)) {
        // FAIL: Hash not in URL
        showOverlay('red', 'FAILS VERIFICATION');
        return;
    }
    // SUCCESS: Hash matches URL
    showOverlay('green', 'VERIFIED');
}
```

## Test Case: Intertek Certification

From `ocr-hash2.png`:

**Original Text (with typos preserved):**
```
This gown was certified by Intertek
on March 1, 2022 for MedPro Ltd of
Douglas, Isle of Man.
UK medical standards Abc123, Def456
apply. #SHAT0664891
Description of gown: one piece,
tie behind, neck loop, spunbond
polypropylene, spash resistent
sterile, double wrapped.
```

**Computed Hash:**
```
483a2710e7b533836a06ed2d34a646bca05e0761cd59e482db9296395313a44f
```

**Verification URL:**
```
https://intertek.com/certifications/483a2710e7b533836a06ed2d34a646bca05e0761cd59e482db9296395313a44f
```

**Note**: Typos like "spash resistent" (not "splash resistant") are intentionally preserved - they're part of what was printed, so they're part of the hash.

## Dependencies

### Runtime (loaded from CDN)
- **Tesseract.js v5**: OCR engine (WASM-based, ~500KB)
- **Web Crypto API**: Built into browsers for SHA-256

### Development (npm install)
- **Jest**: Testing framework
- **Express/CORS**: For optional local server (not needed for GitHub Pages)
- **better-sqlite3**: For build-hashes.js helper script

## Testing

Run tests:
```bash
npm test
```

**17 tests covering:**
- Text normalization rules
- SHA-256 hashing
- Intertek certification (exact text from ocr-hash2.png)
- URL extraction
- Full verification flow

All tests pass. Hash generation is deterministic and matches expected values.

## Deployment

### GitHub Pages (Recommended)
1. Push `public/` folder to GitHub
2. Enable GitHub Pages in repo settings
3. GitHub Actions workflow automatically:
   - Runs tests
   - Deploys to `https://username.github.io/repo-name/`

### CORS Considerations
- App can't always fetch verification URLs due to CORS
- Solution: App checks if hash **exists in URL string** (doesn't need to fetch it)
- Optional: Certification agencies can add CORS headers if they want actual fetches

## Future Enhancements (Not Implemented)

- Manual text input (no camera)
- Multi-language OCR
- QR code generation for verification URLs
- Blockchain integration (Hedera, IOTA as mentioned in blog)
- Batch verification
- PWA/offline mode with service workers

## Why This Architecture?

1. **No server costs**: Static files on GitHub Pages = free
2. **Privacy**: No data sent to servers, everything processed locally
3. **Offline capable**: After initial load, works without internet (except URL verification)
4. **Mobile-first**: Designed for phone cameras
5. **Simple deployment**: Just push to GitHub
6. **Transparent**: All code visible, no black boxes
7. **Scalable**: Each org hosts their own verification endpoints

## How Certification Agencies Use This

1. **Generate certification text**
2. **Normalize it** using same rules
3. **Compute SHA-256 hash**
4. **Create verification URL**: `https://your-org.com/certifications/{HASH}`
5. **Print both text and URL** on document within registration marks
6. **Host endpoint** at that URL returning HTTP 200 (verified) or 404 (not found)

## CORS Workaround Explained

The app doesn't strictly need to fetch the URL. It just checks:
```javascript
claimedUrl.includes(computedHash)
```

This works because:
- If someone prints a fake URL with wrong hash → verification fails
- If URL matches hash → we know the text hasn't been altered
- Trust model: We trust that `intertek.com` wouldn't print fake Intertek URLs

## Known Limitations

1. **OCR accuracy**: Tesseract isn't perfect, may need retries
2. **Registration marks**: User must manually position them
3. **Lighting**: Poor lighting affects OCR quality
4. **Camera quality**: Works best with modern phone cameras
5. **HTTPS required**: Camera API needs HTTPS (GitHub Pages provides this)

## If Returning to This Project

Key files to review:
- `public/app-url-based.js` - main app logic
- `ocr-hash.test.js` - test cases showing expected behavior
- `build-hashes.js` - helper for generating test data
- `.github/workflows/deploy.yml` - CI/CD pipeline

Run `npm test` to verify everything still works.

Check `README.md` for user-facing docs and deployment instructions.

## Related Concepts

- Estonia's KSI blockchain (mentioned in blog post)
- Merkle trees for audit trails
- NFT-less verification (no blockchain needed for basic use case)
- The Medpro/Intertek fraud case that inspired this

## License

GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)
