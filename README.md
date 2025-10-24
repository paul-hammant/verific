# OCR-to-Hash Verification System

**Proof of concept** implementing the approach described in: [OCR-to-Hash: A Simple Audit Trail for Physical Documents](https://paulhammant.com/2023/01/17/ocr-to-hash-simple-audit-trail-for-physical-documents/)

A **100% client-side** web app that uses phone camera OCR to verify physical documents via SHA-256 hash validation against URLs printed on the documents themselves.

**Works on GitHub Pages** - No server needed!

## What It Does

1. Scans printed documents with phone camera (OCR via Tesseract.js)
2. Extracts verification URL from the document
3. Normalizes text (removes extra spaces, etc.)
4. Computes SHA-256 hash
5. Checks if hash matches the URL printed on the document
6. Shows ✅ green "VERIFIED" or ❌ red "FAILS VERIFICATION" overlay

## Example Document

A physical document with registration marks containing:
```
This gown was certified by Intertek
on March 1, 2022 for MedPro Ltd of
Douglas, Isle of Man.
UK medical standards Abc123, Def456
apply. #SHA10664849l
Description of gown: one piece,
tie behind, neck loop, spunbond
polypropylene, spash resistant
sterile, double wrapped.

https://intertek.com/certifications/e6200e...
```

The app verifies the hash in the URL matches the SHA-256 of the normalized text above it.

## Quick Start

**Deploy to GitHub Pages:**
```bash
git push origin main
# Enable GitHub Pages in repo settings → Pages → Source: /public
# Access at: https://YOUR_USERNAME.github.io/YOUR_REPO/
```

**Run Locally:**
```bash
cd public
python3 -m http.server 8000
# Open http://localhost:8000
```

No `npm install` needed - pure HTML/CSS/JS with Tesseract.js from CDN.

## Usage

1. Open app on phone, click "Start Camera"
2. Position registration marks around document text + URL
3. Click "Capture & Verify"
4. See ✅ green "VERIFIED" or ❌ red "FAILS VERIFICATION"

## For Certification Agencies

To create verifiable documents:

1. Generate certification text
2. Normalize it (remove leading/trailing spaces, collapse multiple spaces)
3. Compute SHA-256 hash
4. Print text + URL with hash: `https://your-org.com/certifications/{HASH}`

See `build-hashes.js` for hash generation helper.

## Tech Stack

- **Tesseract.js**: Client-side OCR (loaded from CDN)
- **Web Crypto API**: SHA-256 hashing (built into browsers)
- **Pure HTML/CSS/JS**: No build step, no dependencies

## License

MIT
