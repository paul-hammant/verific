# Verific Training Pages

This directory contains training pages for practicing the Verific OCR-to-hash verification system.

## What Are Training Pages?

Training pages are example certification documents that can be displayed on a computer screen and scanned with the Verific mobile app. Each page contains:

1. **Registration marks** (black squares) that guide the camera crop
2. **Certification text** with product/safety information
3. **Verification URL** pointing to the hash database

## Available Training Pages

1. **medical-ppe-gloves.html** - Medical PPE gloves certification (ASTM D6319-19)
2. **food-safety-equipment.html** - Commercial food slicer certification (NSF/ANSI Standard 8)
3. **electronics-safety.html** - Power supply unit certification (UL 62368-1)

## How to Use

### Step 1: Display on Computer
Open one of the training pages in a web browser on your desktop or laptop computer. Display it at full screen or large size.

### Step 2: Open Verific App on Phone
Navigate to https://paul-hammant.github.io/verific/ on your mobile device.

### Step 3: Scan the Certification
1. Click "Start Camera" in the app
2. Point your phone camera at the computer screen
3. Align the registration marks on your phone with the marks on the training page
4. Click "Capture & Verify"

### Step 4: Review Results
The app will:
- Extract the text via OCR
- Normalize the text
- Compute the SHA-256 hash
- Verify against the certification database at `c/<hash>`

## Expected Results

All training certifications are pre-registered in the hash database with **VERIFIED** status. When scanned correctly, they should:

- ✅ Extract the certification text accurately
- ✅ Compute the correct SHA-256 hash
- ✅ Return "VERIFIED" status from the database

## Corresponding Verification Pages

Each training page has a corresponding Jekyll page in the `c/` directory:

| Training Page | Hash | Verification URL |
|--------------|------|------------------|
| medical-ppe-gloves.html | `3607bbe2d8db4890...` | `/c/3607bbe2d8db48906656230e4bcddc8f34642677c49fd84a51caef8d49a73a1c` |
| food-safety-equipment.html | `d9e01dd0cd363023...` | `/c/d9e01dd0cd3630231285472d0f09367e35f5cbf43a0ac9579b5d29c9541f3c80` |
| electronics-safety.html | `3488a496f310f743...` | `/c/3488a496f310f743da8dbcadb1fbdcaa7987984380dc3a0f8ecaf0683c540f92` |

## Generating New Training Pages

To create new training pages, edit `generate-training-pages.js` and add new certifications to the `certifications` array, then run:

```bash
node generate-training-pages.js
```

This will create:
- HTML training pages in `training-pages/`
- Jekyll verification pages in `c/`

Don't forget to also add the certifications to `build-hashes.js` and rebuild the hash database:

```bash
node build-hashes.js
```

## Tips for Best Results

1. **Lighting**: Ensure the computer screen is bright and evenly lit
2. **Distance**: Hold phone 6-12 inches from screen
3. **Alignment**: Take time to carefully align all four registration marks
4. **Stability**: Keep phone steady when capturing
5. **Focus**: Wait for camera to focus before capturing

## Troubleshooting

**Problem**: OCR extracts surrounding text from the web page

**Solution**: The registration marks define the crop region. Make sure they're aligned precisely with the certification box boundaries.

**Problem**: Text extraction is inaccurate

**Solution**: Improve screen brightness, reduce glare, ensure camera is in focus, and hold phone parallel to screen.

**Problem**: Hash doesn't match

**Solution**: Check that the exact certification text was extracted. Even small differences (extra spaces, line breaks) will change the hash.
