# LLM Context: OCR-to-Hash Verification System

## Project Overview

This is a **100% client-side web application** for verifying physical documents using computer vision, OCR, text normalization, and SHA-256 hashing. It implements the concept from Paul Hammant's blog post: [OCR-to-Hash: A Simple Audit Trail for Physical Documents](https://paulhammant.com/2023/01/17/ocr-to-hash-simple-audit-trail-for-physical-documents/).

## Key Design Decisions

### 1. No Backend Server Required
- **Initial approach**: Built with Express backend + in-memory hash database
- **Final approach**: Pure client-side verification against URLs printed on documents
- **Why**: Can deploy to GitHub Pages for free, works offline, no infrastructure needed

### 2. URL-Based Verification (Not Local Database)
The document itself contains:
- Certification text within black square registration marks
- Verification URL printed below the text (e.g., `https://paul-hammant.github.io/verific/c`)

The app:
1. Uses **OpenCV.js** to detect the black square registration marks
2. Crops to the rectangle defined by the marks
3. Tries **multi-orientation OCR** (0°, 90°, 270°, 180°) and picks the best result
4. Extracts the URL from the last line of OCR text
5. Removes URL line from certification text
6. Normalizes remaining text (Unicode normalization + whitespace rules)
7. Computes SHA-256 hash
8. **Checks if computed hash appears in the claimed URL**
9. Fetches the URL and verifies HTTP 200 + "OK" in response
10. Shows green "VERIFIED" or red "FAILS VERIFICATION" overlay on camera

### 3. No Hardcoded Hashes in the App
- We do **NOT** maintain a local database of valid hashes in the app
- Trust model: The organization that controls the domain (e.g., `paul-hammant.github.io`) is trusted
- Hash database is pre-built and deployed to GitHub Pages at `/c/{hash}/index.html`
- If hash matches URL AND endpoint returns 200 + "OK" → verified
- If hash doesn't match URL OR endpoint fails → verification fails

## File Structure

```
verific/
├── public/                          # Deploy this folder to GitHub Pages
│   ├── index.html                   # Camera UI with registration marks overlay
│   ├── styles.css                   # Responsive design, mobile-first
│   ├── normalize.js                 # Text normalization + SHA-256 (TESTED)
│   ├── app-logic.js                 # Pure functions for URL extraction, rotation (TESTED)
│   ├── app-url-based.js             # Main app logic (camera, OCR, verification)
│   ├── test-normalization.html      # Interactive test page for normalization
│   ├── cv/
│   │   ├── geometry.js              # OpenCV geometry utilities (TESTED)
│   │   └── detectSquares.js         # Registration mark detection (TESTED via E2E)
│   ├── training-pages/              # Training certificates for testing
│   │   ├── index.html               # Landing page
│   │   ├── bachelor-thaumatology.html
│   │   ├── master-applied-anthropics.html
│   │   └── doctorate-high-energy-magic.html
│   ├── c/{hash}/index.html          # Static verification endpoints (200 + "OK")
│   └── hashes.json                  # Hash database metadata
│
├── build-hashes.js                  # Build tool: generates hash database
├── generate-training-pages.js       # Build tool: generates training pages
│
├── ocr-hash.test.js                 # Jest: normalize.js tests (30 tests)
├── app-logic.test.js                # Jest: app-logic.js tests (29 tests)
├── cv-geometry.test.js              # Jest: geometry.js tests
├── detectSquares.node.test.js       # Jest: placeholder tests
│
├── e2e/
│   ├── cv-detect.spec.ts            # Playwright: registration mark detection (8 tests)
│   ├── cv-ocr.spec.ts               # Playwright: OCR integration (8 tests)
│   └── cv-harness.html              # Test harness for E2E tests
│
├── test/fixtures/                   # Test images
│   ├── should-detect/               # Images with valid registration marks
│   ├── should-not-detect/           # Images without marks
│   └── mixed/                       # Mixed test cases
│
├── .github/workflows/
│   └── deploy.yml                   # CI/CD: runs tests, deploys to GitHub Pages
│
├── README.md                        # User-facing documentation
├── TESTING.md                       # Test documentation
├── NORMALIZATION.md                 # Detailed normalization rules
├── BUILDING.md                      # Build instructions
├── GITHUB_PAGES.md                  # Deployment guide
└── LLM.md                           # This file
```

## Core Logic

### Text Normalization Rules (NORMALIZATION.md)

**Step 1: Unicode Character Normalization**
```javascript
// Normalize Unicode characters that OCR might produce
text = text.replace(/[\u201C\u201D\u201E]/g, '"');  // Curly double quotes → straight
text = text.replace(/[\u2018\u2019]/g, "'");        // Curly single quotes → straight
text = text.replace(/[\u00AB\u00BB]/g, '"');        // Angle quotes → straight double
text = text.replace(/[\u2013\u2014]/g, '-');        // En/em dash → hyphen
text = text.replace(/\u00A0/g, ' ');                // Non-breaking space → space
text = text.replace(/\u2026/g, '...');              // Ellipsis → three periods
```

**Step 2: Line-by-Line Normalization**
```javascript
const lines = text.split('\n');
const normalizedLines = lines.map(line => {
    line = line.replace(/^\s+/, '');    // Remove leading spaces
    line = line.replace(/\s+$/, '');    // Remove trailing spaces
    line = line.replace(/\s+/g, ' ');   // Collapse multiple spaces
    return line;
})
.filter(line => line.length > 0);       // REMOVE blank lines
```

**Step 3: Final Assembly**
```javascript
return normalizedLines.join('\n');      // No trailing newline
```

### SHA-256 Hashing

**Input Encoding:** UTF-8
**Output Encoding:** Hex (lowercase)
**HMAC:** No (plain SHA-256)

**Browser implementation:**
```javascript
async function sha256(text) {
    const encoder = new TextEncoder();              // UTF-8 encoding
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;                                 // lowercase hex
}
```

**Node.js implementation (for tests):**
```javascript
function sha256(text) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}
```

### Computer Vision: Registration Mark Detection

Uses **OpenCV.js** to detect black square registration marks:

1. Convert image to grayscale
2. Apply Gaussian blur
3. Adaptive thresholding
4. Find contours
5. Filter for square-like shapes (aspect ratio ~1.0, area > threshold)
6. Select best 4 squares that form a rectangle
7. Apply perspective transform to crop and deskew

**Key files:**
- `public/cv/geometry.js` - Geometry utilities (orderCorners, etc.)
- `public/cv/detectSquares.js` - Detection algorithm

### Multi-Orientation OCR

Since users may hold the camera sideways, the app tries OCR at multiple orientations:

```javascript
const orientations = [
    { rotation: 0, canvas: cropped },                // Most likely (portrait)
    { rotation: 270, canvas: rotateCanvas(cropped, 270) },  // Landscape right
    { rotation: 90, canvas: rotateCanvas(cropped, 90) },    // Landscape left
    { rotation: 180, canvas: rotateCanvas(cropped, 180) }   // Upside down (rare)
];

// Try in order: 0°, 270°, 90°, 180°
// Pick FIRST orientation that achieves high confidence (early exit optimization)
for (const { rotation, canvas } of orientations) {
    const result = await Tesseract.recognize(canvas.toDataURL(), 'eng');
    const confidence = result.data.confidence || 0;

    if (confidence > HIGH_CONFIDENCE_THRESHOLD) {
        // Good enough - use this orientation
        bestResult = result;
        bestRotation = rotation;
        break;
    }
}
```

### High-Resolution Capture

Uses **ImageCapture API** when available for higher resolution than video frames:

```javascript
if ('ImageCapture' in window) {
    const ic = new ImageCapture(track);
    const photo = await ic.takePhoto();           // Returns high-res Blob
    imageBitmap = await createImageBitmap(photo);
}
```

Falls back to canvas capture from video element if ImageCapture not supported.

### Verification Logic

**Full verification requires all three checks:**

```javascript
async function verifyAgainstClaimedUrl(claimedUrl, computedHash) {
    // Check 1: Hash in URL
    if (!hashMatchesUrl(claimedUrl, computedHash)) {
        showOverlay('red', 'FAILS VERIFICATION');
        return;
    }

    // Check 2 & 3: Fetch URL and verify response
    const response = await fetch(claimedUrl);

    if (response.status !== 200) {
        showOverlay('red', 'FAILS VERIFICATION');
        return;
    }

    const body = await response.text();
    if (!body.includes('OK')) {
        showOverlay('red', 'FAILS VERIFICATION');
        return;
    }

    // All checks passed
    showOverlay('green', 'VERIFIED');
}
```

## Test Coverage

### Unit Tests (Jest) - 59 tests

**ocr-hash.test.js (30 tests):**
- Text normalization (whitespace, Unicode characters)
- SHA-256 hashing
- Registration mark positioning
- Full verification flow

**app-logic.test.js (29 tests):**
- Canvas rotation (0°, 90°, 180°, 270°, negative angles)
- URL extraction (space removal, validation)
- Certification text extraction
- Hash matching logic

**cv-geometry.test.js:**
- Corner ordering
- Square candidate scoring

**detectSquares.node.test.js:**
- Placeholder tests (fixtures exist)

### E2E Tests (Playwright) - 16 tests

**e2e/cv-detect.spec.ts (8 tests):**
- Detection on should-detect fixtures ✓
- Detection on mixed fixtures ✓
- Non-detection on should-not-detect fixtures ✓

**e2e/cv-ocr.spec.ts (8 tests):**
- OCR on cropped regions ✓
- Text extraction and normalization ✓

### Test Commands

```bash
npm test              # All tests (unit + E2E)
npm run test:unit     # Jest only
npm run test:e2e      # Playwright only
```

## Training Pages

Three fictional Unseen University certificates (Terry Pratchett universe) for testing:

1. **Bachelor of Thaumatology** - Ponder Stibbons
   - Hash: `1cddfbb2adfa13e4562d274b59e56b946f174a0feb566622dd67a4880cf0b223`

2. **Master of Applied Anthropics** - Esk Weatherwax
   - Hash: `6725b845dcdf2490adf8d5f62e09e5f2055cb80c6200e5ccf58875c8190f4a80`

3. **Doctorate in High Energy Magic** - Adrian Turnipseed
   - Hash: `09d1e6765c2dbd833e5a1f4770d9f0c9368224f7b1aed34de7a3bd5bf4d1f031`

All have corresponding verification endpoints at `/c/{hash}/index.html`

## Dependencies

### Runtime (Loaded from CDN)
- **Tesseract.js v5**: OCR engine (~2MB WASM)
- **OpenCV.js 4.x**: Computer vision for registration mark detection (~8MB)
- **Web Crypto API**: Built into browsers for SHA-256

### Development (npm install)
- **Jest 29**: Testing framework
- **@playwright/test**: E2E testing
- **jsdom**: DOM environment for Jest
- **jest-environment-jsdom**: jsdom integration for Jest

### NOT Used
- ~~Express/CORS~~ (no server needed)
- ~~better-sqlite3~~ (no database needed)

## Build Process

### Generate Hash Database

```bash
node build-hashes.js
```

Creates:
- `public/hashes.json` - Metadata for all hashes
- `public/c/{hash}/index.html` - Verification endpoints
- Updates build timestamp in `public/app-url-based.js`

### Generate Training Pages

```bash
node generate-training-pages.js
```

Creates HTML pages for the three training certificates.

## Deployment

### GitHub Pages (Current)
1. Push to GitHub
2. GitHub Actions runs tests
3. Deploys `public/` folder to `https://paul-hammant.github.io/verific/`

### Local Testing
```bash
cd public
python3 -m http.server 8000
# Visit http://localhost:8000
```

**Note:** HTTPS required for camera access. Use GitHub Pages or ngrok for mobile testing.

## CORS Considerations

The app performs a **full fetch** of verification URLs:
- If CORS allows: Fetches and checks for HTTP 200 + "OK" in body
- If CORS blocks: Shows "CANNOT VERIFY - Network error or CORS restriction"

Most verification endpoints need CORS headers:
```
Access-Control-Allow-Origin: *
```

GitHub Pages provides this automatically.

## UI/UX Features

### Camera Controls
- Enable Camera → Stop Camera
- Floating shutter button (center of viewfinder)
- Resolution fallback: 4K → 1080p → 720p

### Result Display (Tabbed Interface)
1. **Captured Image** - Cropped & oriented image with "Copy Image" button
2. **Extracted Text** - Raw OCR output
3. **Normalized Text** - After normalization rules applied

### Status Indicators
- 📷 Ready to scan
- ✅ Camera active
- 📸 Capturing...
- 🧭 Detecting registration square...
- 🔄 Detecting text orientation...
- 🔧 Normalizing text...
- 🔐 Generating hash...
- 🌐 Verifying against claimed URL...
- ✅ VERIFIED / ❌ FAILS VERIFICATION

### Easter Egg
Click the app title to see build timestamp.

## Recent Development (Jan 2025)

### Progress Bar Timing Fix
- **Issue:** Progress bar appeared before camera shutter
- **Fix:** Reordered code to capture image first, then show processing

### Test Coverage Expansion
- Added `app-logic.test.js` (29 tests) for pure functions
- Extracted testable logic from `app-url-based.js`
- All production browser code now tested (except DOM/API-dependent code)

### Documentation Updates
- Added SHA-256 parameters to NORMALIZATION.md (UTF-8 input, hex lowercase output, no HMAC)
- Updated implementation notes to reflect test coverage

### Code Deduplication
- Created `public/normalize.js` as single source of truth
- Removed duplicate normalization from `app-url-based.js` and test pages
- Build tool mirrors the same logic

## Known Limitations

1. **OCR accuracy**: Tesseract isn't perfect, may need retries
2. **Registration marks**: Must be visible and form a clear rectangle
3. **Lighting**: Poor lighting affects both detection and OCR quality
4. **Camera quality**: Works best with modern phone cameras
5. **HTTPS required**: Camera API needs HTTPS (GitHub Pages provides this)
6. **Wide-angle lens**: Some phones capture wide FOV, reducing text pixel density
7. **iOS zoom**: No zoom control available on iOS Safari

## Architecture Rationale

1. **No server costs**: Static files on GitHub Pages = free
2. **Privacy**: No data sent to servers, everything processed locally
3. **Offline capable**: After initial load, works without internet (except URL verification)
4. **Mobile-first**: Designed for phone cameras
5. **Simple deployment**: Just push to GitHub
6. **Transparent**: All code visible, no black boxes
7. **Scalable**: Each org hosts their own verification endpoints
8. **Testable**: 59 unit tests + 16 E2E tests, all production code tested

## How Certification Agencies Use This

1. **Generate certification text**
2. **Normalize it** using same rules (Unicode + whitespace)
3. **Compute SHA-256 hash**
4. **Create verification URL**: `https://your-org.com/c`
5. **Print text + registration marks + URL** on document
6. **Host endpoint** at `https://your-org.com/c/{hash}` returning:
   - HTTP 200 status
   - Body containing "OK"
   - CORS header: `Access-Control-Allow-Origin: *`

## Trust Model

The app verifies:
1. ✅ Computed hash matches the hash in the URL
2. ✅ URL endpoint exists (HTTP 200)
3. ✅ Endpoint confirms validity (body contains "OK")

**Trust assumption:** The domain owner (e.g., `intertek.com`) won't host fake verification endpoints.

**Attack resistance:**
- Can't forge a URL with correct hash without the original text
- Can't alter text without changing the hash
- Can't use someone else's hash because OCR'd URL won't match

## If Returning to This Project

### Quick Start
```bash
npm install
npm test                    # Should see 59 + 16 tests pass
node build-hashes.js        # Regenerate hash database
```

### Key Files to Review
- `public/app-url-based.js` - Main app logic
- `public/normalize.js` - Normalization (tested)
- `public/app-logic.js` - Pure functions (tested)
- `public/cv/detectSquares.js` - Computer vision
- `ocr-hash.test.js` - Test cases showing expected behavior
- `app-logic.test.js` - More test cases
- `NORMALIZATION.md` - Complete normalization spec

### Common Tasks
- **Add training page:** Edit `generate-training-pages.js`, run it, add hash to `build-hashes.js`
- **Change normalization:** Update `public/normalize.js`, verify tests pass
- **Fix detection:** Adjust thresholds in `public/cv/detectSquares.js`
- **Add fixture:** Place PNG in `test/fixtures/should-detect/`, add `.txt` with expected text

## Related Concepts

- Estonia's KSI blockchain (mentioned in blog post)
- Merkle trees for audit trails
- NFT-less verification (no blockchain needed for basic use case)
- The Medpro/Intertek fraud case that inspired this
- OpenCV.js for web-based computer vision

## License

GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)

All code requires AGPL license header. Run `./add-license-headers.sh` to add missing headers.
