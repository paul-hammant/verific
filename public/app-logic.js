/*
    Copyright (C) 2025, Paul Hammant

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Pure functions for app logic that can be tested with Jest
 */

/**
 * Rotate canvas by degrees (for orientation correction)
 * @param {HTMLCanvasElement} sourceCanvas - The source canvas to rotate
 * @param {number} degrees - Rotation angle (0, 90, 180, 270)
 * @returns {HTMLCanvasElement} - New rotated canvas
 */
function rotateCanvas(sourceCanvas, degrees) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Normalize degrees to 0, 90, 180, 270
    degrees = ((degrees % 360) + 360) % 360;

    // Swap dimensions for 90/270 degree rotations
    if (degrees === 90 || degrees === 270) {
        canvas.width = sourceCanvas.height;
        canvas.height = sourceCanvas.width;
    } else {
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);

    return canvas;
}

/**
 * Extract verification URL from OCR raw text
 * Expects URL to be the last non-empty line starting with "https"
 * @param {string} rawText - Raw OCR text
 * @returns {{url: string, urlLineIndex: number}} - Extracted URL and its line index
 * @throws {Error} If no text found or last line doesn't start with https
 */
function extractVerificationUrl(rawText) {
    const rawLines = rawText.split('\n').map(l => l.trim());

    // Find the index of the last non-empty line
    let lastNonEmptyIndex = -1;
    for (let i = rawLines.length - 1; i >= 0; i--) {
        if (rawLines[i]) {
            lastNonEmptyIndex = i;
            break;
        }
    }

    if (lastNonEmptyIndex === -1) {
        throw new Error('No text found in image');
    }

    const lastNonEmpty = rawLines[lastNonEmptyIndex];

    // Remove ALL spaces from the URL line (OCR often adds errant spaces)
    const lastNoSpaces = lastNonEmpty.replace(/\s+/g, '');

    // Check if line begins with https (that's unique enough)
    if (!lastNoSpaces.toLowerCase().startsWith('https')) {
        throw new Error('Bottom line inside the marks must be a verification URL starting with https');
    }

    return {
        url: lastNoSpaces,
        urlLineIndex: lastNonEmptyIndex
    };
}

/**
 * Extract certification text from raw OCR text (everything before the URL line)
 * @param {string} rawText - Raw OCR text
 * @param {number} urlLineIndex - Index of the URL line
 * @returns {string} - Certification text (lines before URL, trailing blanks removed)
 */
function extractCertText(rawText, urlLineIndex) {
    const rawLines = rawText.split('\n').map(l => l.trim());

    // Get certification text - everything before the URL line
    const certLines = rawLines.slice(0, urlLineIndex);

    // Remove trailing blank lines
    while (certLines.length > 0 && certLines[certLines.length - 1].trim() === '') {
        certLines.pop();
    }

    return certLines.join('\n');
}

/**
 * Check if computed hash matches the claimed URL
 * @param {string} claimedUrl - The claimed verification URL
 * @param {string} computedHash - The computed SHA-256 hash
 * @returns {boolean} - True if hash is found in URL
 */
function hashMatchesUrl(claimedUrl, computedHash) {
    return claimedUrl.includes(computedHash);
}

// Export for Node.js testing (doesn't affect browser usage)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        rotateCanvas,
        extractVerificationUrl,
        extractCertText,
        hashMatchesUrl
    };
}
