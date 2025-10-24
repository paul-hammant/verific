# Testing Guide

## Running Tests

```bash
npm test
```

## Test Coverage

The test suite (`ocr-hash.test.js`) validates:

### 1. Text Normalization
- Removes leading spaces
- Removes trailing spaces
- Collapses multiple spaces to single space
- Preserves blank lines

### 2. SHA-256 Hashing
- Generates correct hashes
- Different text produces different hashes
- Normalized text produces consistent hashes

### 3. Intertek Certification (from ocr-hash2.png)

**Original Text:**
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

**Generated Hash:**
```
483a2710e7b533836a06ed2d34a646bca05e0761cd59e482db9296395313a44f
```

**Verification URL:**
```
https://intertek.com/certifications/483a2710e7b533836a06ed2d34a646bca05e0761cd59e482db9296395313a44f
```

### 4. URL Extraction
- Extracts HTTPS/HTTP URLs from OCR text
- Removes URL lines from certification text
- Preserves certification content

### 5. Full Verification Flow
- Verifies documents when hash matches URL
- Fails verification when hash doesn't match URL

## Manual Testing with Physical Documents

### Test Document 1: Intertek Certification

Print this document and test with the app:

```
┌──────────────────────────────────────────────┐
│ This gown was certified by Intertek          │
│ on March 1, 2022 for MedPro Ltd of           │
│ Douglas, Isle of Man.                        │
│ UK medical standards Abc123, Def456          │
│ apply. #SHAT0664891                          │
│ Description of gown: one piece,              │
│ tie behind, neck loop, spunbond              │
│ polypropylene, spash resistent               │
│ sterile, double wrapped.                     │
│                                               │
│ https://intertek.com/certifications/483a2... │
└──────────────────────────────────────────────┘
```

Expected result: ✅ Green "VERIFIED" overlay

### Test Document 2: Invalid Hash

Print this with a wrong hash:

```
┌──────────────────────────────────────────────┐
│ This gown was certified by Intertek          │
│ on March 1, 2022 for MedPro Ltd of           │
│ Douglas, Isle of Man.                        │
│ UK medical standards Abc123, Def456          │
│ apply. #SHAT0664891                          │
│ Description of gown: one piece,              │
│ tie behind, neck loop, spunbond              │
│ polypropylene, spash resistent               │
│ sterile, double wrapped.                     │
│                                               │
│ https://intertek.com/certifications/wronghash│
└──────────────────────────────────────────────┘
```

Expected result: ❌ Red "FAILS VERIFICATION" overlay

## Edge Cases Tested

- **Typos preserved**: "spash resistent" (not "splash resistant")
- **Special characters**: #SHAT0664891 preserved
- **Whitespace variations**: Leading/trailing spaces normalized
- **Multiple spaces**: Collapsed to single space
- **Blank lines**: Preserved in normalized text

## Continuous Integration

Tests run automatically on GitHub Actions when you push to main/master:

1. Install dependencies
2. Run Jest tests
3. If tests pass, deploy to GitHub Pages

See `.github/workflows/deploy.yml` for CI/CD configuration.

## Adding New Tests

To test a new certification:

1. Add the exact text to `ocr-hash.test.js`
2. Run `npm test` to see the generated hash
3. Print the document with that hash in the URL
4. Test with the camera app

Example:
```javascript
it('should verify new certification', () => {
  const text = `Your certification text here`;
  const normalized = normalizeText(text);
  const hash = sha256(normalized);

  console.log('Hash:', hash);
  console.log('URL:', `https://your-org.com/verify/${hash}`);

  expect(hash).toHaveLength(64);
});
```
