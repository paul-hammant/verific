# Text Normalization Rules

Before computing the SHA-256 hash of certification text, the following normalization steps are applied **in this order**:

## 1. Unicode Character Normalization

OCR often produces Unicode variants of standard ASCII characters. These are normalized first:

### Quotation Marks
- **Left double quote** (`"` U+201C) → `"` (straight double quote, U+0022)
- **Right double quote** (`"` U+201D) → `"` (straight double quote, U+0022)
- **Double low-9 quote** (`„` U+201E) → `"` (straight double quote, U+0022)
- **Left single quote** (`'` U+2018) → `'` (straight apostrophe, U+0027)
- **Right single quote** (`'` U+2019) → `'` (straight apostrophe, U+0027)
- **Left angle quote** (`«` U+00AB) → `"` (straight double quote, U+0022)
- **Right angle quote** (`»` U+00BB) → `"` (straight double quote, U+0022)

### Dashes
- **En dash** (`–` U+2013) → `-` (hyphen-minus, U+002D)
- **Em dash** (`—` U+2014) → `-` (hyphen-minus, U+002D)

### Spaces
- **Non-breaking space** (U+00A0) → ` ` (regular space, U+0020)

### Ellipsis
- **Horizontal ellipsis** (`…` U+2026) → `...` (three periods)

## 2. Line-by-Line Normalization

After Unicode character normalization, each line is processed:

1. **Remove leading whitespace** - All spaces and tabs at the start of the line are removed
2. **Remove trailing whitespace** - All spaces and tabs at the end of the line are removed
3. **Collapse multiple spaces** - Any sequence of 2+ spaces is replaced with a single space

## 3. Blank Line Removal

After line normalization:

- **Remove all blank lines** - Any line that is empty (length 0) after trimming is removed

## 4. Final Assembly

- Lines are joined with newline characters (`\n` U+000A)
- **No trailing newline** is added to the final text

## Example

### Input (with OCR errors):
```
  Unseen University

  College of High Energy Magic

  Thesis: "On the Malleability of L–Space"
```

### After normalization:
```
Unseen University
College of High Energy Magic
Thesis: "On the Malleability of L-Space"
```

### Changes applied:
1. Curly quotes `"` `"` → straight quotes `"`
2. En dash `–` → hyphen `-`
3. Leading spaces removed from each line
4. Trailing spaces removed from each line
5. Blank lines removed
6. No trailing newline

## 5. SHA-256 Hash Computation

After normalization, the SHA-256 hash is computed with these parameters:

- **Input Encoding:** UTF-8
- **Output Encoding:** Hex (lowercase)
- **HMAC:** No (plain SHA-256, not HMAC-SHA256)

### Command-line verification example:
```bash
printf 'Normalized text here' | sha256sum
```

### JavaScript implementation:
```javascript
const encoder = new TextEncoder();  // UTF-8 encoding
const data = encoder.encode(normalizedText);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  // lowercase hex
```

## Implementation

The code is implemented in:
- **Production** (public/normalize.js) - text normalization and hashing for the live webapp
- **Production** (public/app-logic.js) - pure functions for URL extraction, text processing, and canvas rotation
- **Build tool** (build-hashes.js) - Node.js script for creating the hash database
- **Tests** (ocr-hash.test.js) - tests normalize.js (30 tests)
- **Tests** (app-logic.test.js) - tests app-logic.js (29 tests)

All tests validate the production browser code to ensure correctness. The build tool mirrors the same normalization logic to pre-compute hashes for the database.
