# OCR-to-Hash Verification System

A **100% client-side** web verification app that uses phone camera OCR to confirm document authenticity via SHA-256 hash validation against URLs printed on the documents themselves. Based on the concept described in [OCR-to-Hash: A Simple Audit Trail for Physical Documents](https://paulhammant.com/2023/01/17/ocr-to-hash-simple-audit-trail-for-physical-documents/).

**Works on GitHub Pages** - No server needed!

## Features

- **Camera-based OCR**: Uses phone camera to capture text within registration marks
- **Tesseract.js Integration**: Client-side OCR processing (no server needed!)
- **URL Extraction**: Automatically finds verification URLs in scanned text
- **Text Normalization**: Implements whitespace normalization rules
  - Remove leading/trailing spaces per line
  - Collapse multiple spaces to single space
  - Preserve blank lines
- **SHA-256 Hashing**: Cryptographic hash generation in-browser
- **URL-based Verification**: Checks if computed hash matches the URL printed on document
- **Visual Overlay**: Green "VERIFIED" or red "FAILS VERIFICATION" overlay on camera
- **100% Client-Side**: No backend server required - works on GitHub Pages!
- **Works Offline**: After initial load, works without internet (except URL verification)

## Use Cases

- **Product Certifications**: Verify safety certifications (CE marks, Intertek, etc.)
- **Receipt Verification**: Validate retail receipts
- **Document Authentication**: Confirm authenticity of printed documents
- **Fraud Prevention**: Detect fake certifications (like the Medpro/Intertek case)

## How It Works

```
┌─────────────────────────────────────────────────────┐
│  Physical Document with Registration Marks          │
│  ┌──────────────────────────────────────────────┐  │
│  │ This gown was certified by Intertek          │  │
│  │ on March 1, 2022 for MedPro Ltd...           │  │
│  │                                               │  │
│  │ https://intertek.com/certifications/e6200e... │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                       │
                       │ 1. Scan with phone camera
                       ▼
         ┌─────────────────────────┐
         │  Tesseract.js OCR       │
         │  (Client-side WASM)     │
         └────────┬────────────────┘
                  │
                  │ 2. Extract text & URL
                  ▼
         ┌─────────────────────────┐
         │  Separate text from URL │
         └────────┬────────────────┘
                  │
                  │ 3. Normalize text
                  ▼
         ┌─────────────────────────┐
         │  SHA-256 Hash           │
         │  (Web Crypto API)       │
         └────────┬────────────────┘
                  │
                  │ 4. Compare hash
                  ▼
         ┌─────────────────────────┐
         │  Hash in claimed URL?   │
         └────────┬────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ✅ MATCH          ❌ MISMATCH
    Green Overlay     Red Overlay
```

## Quick Start

### Option 1: Deploy to GitHub Pages (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add public/
   git commit -m "Add OCR verification app"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from branch `main`, folder `/public` or root
   - Save

3. **Access your app**:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```

### Option 2: Run Locally

1. **Serve the `public/` folder**:
   ```bash
   cd public
   python3 -m http.server 8000
   # Or: npx http-server . -p 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000
   ```

**Note**: No `npm install` needed! The app is pure HTML/CSS/JS with Tesseract.js loaded from CDN.

## Usage

### For End Users (Verification)

1. **Open the app** on your phone (works best with rear camera)
2. **Click "Start Camera"** and grant camera permissions
3. **Position the registration marks** around the text + verification URL on the document
4. **Click "Capture & Verify"**
5. The app will:
   - Extract all text via OCR
   - Find the verification URL (e.g., `https://intertek.com/certifications/abc123...`)
   - Separate the URL from the certification text
   - Normalize the text (remove extra spaces, etc.)
   - Compute SHA-256 hash
   - Check if the hash appears in the claimed URL
6. **See instant visual feedback**:
   - ✅ **Green overlay "VERIFIED"** = Hash matches URL
   - ❌ **Red overlay "FAILS VERIFICATION"** = Hash doesn't match URL

### For Certification Agencies (Document Creation)

To create verifiable documents, your organization needs to:

1. **Generate the certification text** (as will be printed)
2. **Normalize it** using the same rules (see `build-hashes.js`)
3. **Compute SHA-256 hash** of the normalized text
4. **Create a verification URL** containing the hash:
   ```
   https://your-org.com/certifications/{HASH}
   ```
5. **Print both the text AND the URL** on the document within registration marks

Example document layout:
```
┌─────────────────────────────────────┐
│ Product: Medical Mask Type IIR     │
│ Manufacturer: SafetyFirst Ltd      │
│ Certification: EN 14683:2019       │
│ Batch: 2023-045-A                  │
│                                     │
│ https://bsigroup.com/verify/a1b2c.. │
└─────────────────────────────────────┘
```

The URL endpoint should return HTTP status:
- **200 OK** = Verified
- **404 Not Found** = Unknown/Invalid
- **403 Forbidden** = Revoked

## Build Tools (Optional)

The repository includes `build-hashes.js` - a Node.js script to help generate hashes for testing:

```bash
npm install  # Only needed for build tools
node build-hashes.js
```

This generates a `hashes.json` file with sample certifications. You can use this to test the hash generation logic, but **the app itself doesn't need it** - it works purely client-side.

## Text Normalization Rules

The system applies these normalization rules (as per the original document):

1. **Remove leading spaces** - Left edge of each line
2. **Remove trailing spaces** - Right edge of each line
3. **Collapse multiple spaces** - Multiple spaces → single space
4. **Preserve blank lines** - Empty lines kept as line breaks

Example:
```
Input:  "  Hello    World  \n\n  Test  "
Output: "Hello World\n\nTest"
```

## Example Test Document

You can test the app with a printed version of this sample certification:

```
┌────────────────────────────────────────────────┐
│ This gown was certified by Intertek            │
│ on March 1, 2022 for MedPro Ltd of             │
│ Douglas, Isle of Man.                          │
│ UK medical standards Abc123, Def456            │
│ apply. #SHA10664849l                           │
│ Description of gown: one piece,                │
│ tie behind, neck loop, spunbond                │
│ polypropylene, spash resistant                 │
│ sterile, double wrapped.                       │
│                                                 │
│ https://intertek.com/certifications/e6200e... │
└────────────────────────────────────────────────┘
```

The hash for this text is: `e6200eead4c2ec90f6393eb1559d4b24c3dcbdc54e6fd610014bb9f668cc8710`

So the verification URL would be:
```
https://intertek.com/certifications/e6200eead4c2ec90f6393eb1559d4b24c3dcbdc54e6fd610014bb9f668cc8710
```

## Security Considerations

### Client-Side Verification

- **No Database Needed**: The app doesn't store hashes - it verifies by checking if the computed hash matches the URL printed on the document
- **HTTPS Required**: Camera access requires HTTPS (GitHub Pages provides this)
- **CORS Limitations**: The app can't always fetch the verification URL due to CORS, but it still checks if the hash matches the URL string
- **Trust Model**: You trust that the certification agency controls the domain in the URL (e.g., `intertek.com`)

### For Certification Agencies

- **HTTPS Endpoints**: Your verification URLs must be HTTPS
- **CORS Headers**: If you want the app to actually fetch your URLs, add CORS headers:
  ```
  Access-Control-Allow-Origin: *
  ```
- **Rate Limiting**: Implement rate limiting on your verification endpoints
- **Audit Trail**: Log all verification requests with timestamps
- **Hash Integrity**: Never expose the original text via your API - only confirm/deny validity

## Production Deployment

Simply deploy to **GitHub Pages** (100% free):

1. Push the `/public` folder to GitHub
2. Enable GitHub Pages in repo settings
3. Done!

**Alternative Options**:
- **Netlify**: Drag & drop the `public/` folder
- **Vercel**: Connect your GitHub repo
- **Cloudflare Pages**: Similar to GitHub Pages
- **Any Static Host**: S3, Azure Static Web Apps, etc.

**Cost**: $0 for up to ~200,000 users/month on GitHub Pages

## Browser Compatibility

- **Camera Access**: Requires HTTPS (except localhost)
- **WebCrypto API**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Tesseract.js**: Works on all modern browsers
- **Best Experience**: Mobile devices with rear camera

## Future Enhancements

- [ ] Manual text input option
- [ ] Multi-language OCR support
- [ ] QR code generation for verification URLs
- [ ] Blockchain integration (Hedera, IOTA)
- [ ] Batch verification
- [ ] Offline mode with sync
- [ ] Integration with Estonia's KSI blockchain model

## References

- [Original Blog Post](https://paulhammant.com/2023/01/17/ocr-to-hash-simple-audit-trail-for-physical-documents/)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## License

MIT

## Contributing

Interested in making this an international standard? Contributions welcome!
