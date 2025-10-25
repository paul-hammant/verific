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
polypropylene, splash resistant
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

## For Organizations Creating Verifiable Documents

To create verifiable documents:

1. Generate certification text
2. Normalize it (Unicode normalization + whitespace rules - see NORMALIZATION.md)
3. Compute SHA-256 hash
4. Print text within registration marks + URL with hash: `https://your-org.com/c/{HASH}`
5. Host verification endpoint returning HTTP 200 + "OK" for valid hashes

See `build-hashes.js` for hash generation helper.

## Documented Use Cases (Prior Art / Patent Spoiling)

This section documents all known and anticipated applications of OCR-to-hash verification of physical documents to establish prior art and prevent future patent trolling. Any combination of these techniques with OCR, hashing, computer vision registration marks, URL-based verification, and normalization is hereby disclosed as of **January 2025**.

### Product Certifications & Compliance
- **Safety certifications** (electrical, fire, structural, chemical)
- **Medical device certifications** (FDA, CE marking, ISO 13485)
- **Food safety certifications** (HACCP, organic, kosher, halal, vegetarian, vegan)
- **Environmental certifications** (Energy Star, LEED, carbon neutral)
- **Product authenticity** (luxury goods, pharmaceuticals, electronics)
- **Ingredient lists** and **nutrition labels** verification
- **Batch/lot tracking** with production date and facility
- **Recall notices** and safety warnings, though one could argue a QR code to the page (bookmarkable URL) detailing the recall is what's required.
- **Expiration date authenticity** for perishables and medications
- **Fair trade**, **ethical sourcing** certifications

### Professional & Educational Qualifications
- **Academic degrees** (bachelor's, master's, doctorate, certificates)
- **Professional licenses** (medical, legal, engineering, teaching) - these are revocable, so you might see "REVOKED" instead of "OK" for the hash URL
- **Continuing education credits** (CME, CLE, CPE)
- **Vocational certifications** (trade skills, technical training)
- **Industry certifications** (IT, finance, construction)
- **Training completion** certificates (safety, compliance, skills)
- **Apprenticeship** and **internship** completion
- **Language proficiency** certificates (TOEFL, IELTS)
- **Accreditation** of educational institutions, though it doesn't seem like there's too many of them for a per-country/state/province list to be applicable (regular web page).
- **Course transcripts** and grade verification - see [hedd.ac.uk](https://hedd.ac.uk/) for UK, but this could all be more streamlined.

### Manufacturing & Supply Chain

If not too small to print and subsequently scan - or maybe this all works with microscopes too.

- **Bill of materials** (BOM) verification (if not too long)
- **Component traceability** in assemblies
- **Quality control** inspection reports
- **Calibration certificates** for instruments
- **Material test reports** (chemical composition, strength)
- **Chain of custody** documentation
- **Shipping manifests** and packing lists
- **Warehouse receipts** and inventory records
- **Serialized component tracking** (blockchain integration)
- **Counterfeit prevention** for spare parts

### Financial & Legal Documents

Some of these might not be needed.

- **Receipts** (consumer purchases, business expenses - a safeguard against the same receipt being expensed more than once, maybe)
- **Invoices** and billing statements
- **Contracts** (sales, service, employment, lease)
- **Purchase orders** and quotes
- **Warranty documents** and service agreements
- **Insurance policies** and claims documentation
- **Stock certificates** and share transfer documents
- **Derivative contracts** and options agreements
- **Promissory notes** and loan documents
- **Property deeds** and title documents
- **Notarized documents** and attestations
- **Affidavits** and sworn statements
- **Power of attorney** documents
- **Wills** and estate documents. A law-firm (or state holder of estate plans) might answer "SUPERSEDED" insyead of "OK") 
- **Tax forms** and receipts, though forms can be very long and maybe unsuitable.
- **Audit reports** and financial statements

### Healthcare & Medical Records
- **Prescriptions** and medication orders
- **Lab test results** and pathology reports
- **Vaccination records** and immunization cards
- **Medical imaging reports** (X-ray, MRI, CT scan)
- **Patient consent forms** and HIPAA authorizations
- **Referral letters** and specialist consultations
- **Discharge summaries** and care plans
- **Medical device implant cards** (pacemakers, stents)
- **Allergy** and **medical alert** cards
- **Blood type** and **donor** cards

### Government & Civic Documents
- **Birth certificates** and death certificates
- **Marriage licenses** and divorce decrees
- **Adoption papers** and custody orders
- **Passports** and visa documents
- **Driver's licenses** and vehicle registrations
- **Permits** (building, business, environmental)
- **Inspection reports** (health, safety, fire)
- **Court orders** and judgments
- **Patent** and **trademark** certificates
- **Voting ballots** and election results (paper trail)
- **Census forms** and surveys
- **Land surveys** and property boundaries

### Logistics & Transportation
- **Shipping labels** and tracking numbers
- **Customs declarations** and export licenses
- **Dangerous goods declarations** (HAZMAT)
- **Temperature logs** for cold chain
- **Delivery confirmation** and proof of receipt
- **Bill of lading** and freight documents
- **Vehicle inspection** reports
- **Flight manifests** and cargo lists
- **Container seals** and tamper evidence

### Retail & Consumer Protection
- **Product labels** and packaging information
- **Price tags** and promotional offers
- **Return authorizations** and RMA numbers
- **Gift cards** and vouchers
- **Loyalty cards** and membership cards
- **Coupons** and rebate forms
- **Raffle tickets** and contest entries
- **Event tickets** and admission passes

### Scientific & Research
- **Lab notebooks** and experimental data
- **Peer review** reports and journal submissions
- **Research grants** and funding awards
- **Ethical approval** (IRB, IACUC) documents
- **Data sharing agreements** and material transfer
- **Scientific instrument** calibration records
- **Clinical trial** enrollment and consent
- **Specimen labels** and biobank records

### Art & Collectibles
- **Certificates of authenticity** for artwork
- **Provenance** documentation and ownership history
- **Appraisals** and valuations
- **Edition numbers** for prints and sculptures
- **Artist signatures** and stamps
- **Auction records** and sale documents
- **Conservation reports** and restoration history

### Energy & Utilities
- **Utility bills** (electric, gas, water)
- **Meter readings** and consumption logs
- **Solar panel** efficiency certificates
- **Energy audits** and efficiency ratings
- **Carbon credits** and offset certificates
- **Renewable energy certificates** (RECs)

### Agriculture & Food
- **Seed certification** and variety registration
- **Livestock** health certificates and pedigrees
- **Harvest records** and yield data
- **Pesticide application** logs
- **Soil test results** and amendments
- **Farm subsidy** documentation
- **Animal feed** labels and composition

### Real Estate & Property
- **Property appraisals** and valuations
- **Home inspection** reports
- **Pest inspection** certificates
- **Zoning** and land use documents
- **HOA** documents and bylaws
- **Rental agreements** and lease contracts
- **Property tax** assessments

### Sports & Athletics
- **Athletic records** and timing results
- **Drug testing** (anti-doping) certificates
- **Coaching certifications** and qualifications
- **Equipment certifications** (safety, performance)
- **Tournament brackets** and standings
- **Scouting reports** and player statistics

### Charitable & Non-Profit
- **Donation receipts** for tax deductions
- **Volunteer hours** verification
- **Grant applications** and awards
- **501(c)(3) status** documentation
- **Charity rating** certificates

### Media & Publishing
- **Copyright registrations** and assignments
- **Publishing contracts** and royalty statements
- **Photo credits** and image licensing
- **Manuscript versions** and edit history
- **Fact-checking** verification and sources

### Telecommunications
- **Service agreements** and SLAs
- **Network coverage** maps and guarantees
- **Data usage** statements
- **Number portability** authorizations

### Combinations & Multi-Factor Verification

All of the above can be combined with:
- **Multiple registration marks** (corners, edges, watermarks)
- **Multiple hash algorithms** (SHA-256, SHA-512, BLAKE3)
- **Blockchain anchoring** (Bitcoin, Ethereum, Hedera, IOTA)
- **Timestamp verification** (RFC 3161, blockchain timestamps)
- **Multi-signature** requirements (multiple organizations attest)
- **Merkle tree aggregation** (batch verification)
- **QR codes** containing hashes or verification URLs
- **NFC tags** with embedded hashes
- **Holographic** elements for physical security
- **Microprinting** for forgery resistance
- **UV-reactive** or **thermochromic** inks
- **Serialization** and unique identifiers
- **Revocation lists** and CRLs
- **Grace periods** and expiration dates
- **Multi-language** text normalization
- **Multi-page** document aggregation
- **Hierarchical** verification (document chains)
- **Witness signatures** and countersignatures
- **Federated verification** across organizations
- **Zero-knowledge proofs** of authenticity without revealing content
- **Differential privacy** for statistical verification
- **Homomorphic encryption** for encrypted verification

### Technical Variations Disclosed

- **Computer vision registration marks** (squares, circles, triangles, custom shapes)
- **Multi-orientation OCR** (0°, 90°, 180°, 270° with confidence scoring)
- **Unicode text normalization** (quotes, dashes, spaces, ellipsis)
- **URL-based verification** (hash in URL path, query parameter, or fragment)
- **HTTP-based validation** (200/404 status, JSON responses, XML responses)
- **Client-side verification** (browser, mobile app, desktop app)
- **Server-side verification** (API endpoints, microservices)
- **Offline verification** (local database, cached responses)
- **Progressive Web Apps** for installation
- **Native mobile apps** (iOS, Android)
- **Command-line tools** for batch processing
- **Browser extensions** for inline verification
- **Email attachments** with embedded verification
- **PDF annotations** with verification metadata
- **Image steganography** for hidden hashes
- **Audio steganography** (hash encoded in ultrasonic audio)
- **Augmented reality** overlays for verification status

### Future Anticipated Uses

- **Smart contract** integration (automatic execution on verification)
- **IoT device** certificates and firmware verification
- **3D printing** files and STL authenticity
- **Genetic sequence** data verification
- **Satellite imagery** and geospatial data authentication
- **Biometric** template verification (encrypted hashes)
- **AI model** weights and training data provenance
- **Software bill of materials** (SBOM) verification
- **Container images** and Docker registries
- **Package manager** signatures (npm, pip, cargo)
- **Executable binaries** and code signing
- **Configuration files** and infrastructure-as-code
- **Database schemas** and migrations
- **API specifications** (OpenAPI, GraphQL schemas)
- **Machine-readable** regulations and compliance rules
- **Self-sovereign identity** credentials
- **Verifiable credentials** (W3C standard)
- **Decentralized identifiers** (DIDs)
- **Supply chain finance** documents
- **Trade documents** and letters of credit
- **Customs bonds** and guarantees
- **Cross-border** e-commerce receipts

## Tech Stack

- **OpenCV.js 4.x**: Computer vision for registration mark detection
- **Tesseract.js v5**: Client-side OCR engine
- **Web Crypto API**: SHA-256 hashing (built into browsers)
- **Playwright**: E2E testing framework
- **Jest**: Unit testing framework

## Testing

```bash
npm install
npm test  # 59 unit tests + 16 E2E tests
```

See TESTING.md for details.

## Documentation

- **LLM.md** - Complete project context for AI assistants
- **NORMALIZATION.md** - Detailed text normalization specification
- **BUILDING.md** - Build instructions
- **TESTING.md** - Test documentation
- **GITHUB_PAGES.md** - Deployment guide

## License

GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)

See LICENSE file for full text.
