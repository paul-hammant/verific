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
 * Shared text normalization and hashing functions
 * Used by both the main app and test pages
 */

// Text normalization function (as per the document rules)
function normalizeText(text) {
    // Normalize Unicode characters that OCR might produce
    text = text.replace(/[\u201C\u201D\u201E]/g, '"');  // Curly double quotes → straight
    text = text.replace(/[\u2018\u2019]/g, "'");        // Curly single quotes → straight
    text = text.replace(/[\u00AB\u00BB]/g, '"');        // Angle quotes → straight double
    text = text.replace(/[\u2013\u2014]/g, '-');        // En/em dash → hyphen
    text = text.replace(/\u00A0/g, ' ');                // Non-breaking space → space
    text = text.replace(/\u2026/g, '...');              // Ellipsis → three periods

    // Split into lines
    const lines = text.split('\n');

    // Apply normalization rules to each line
    const normalizedLines = lines.map(line => {
        // Remove leading spaces
        line = line.replace(/^\s+/, '');
        // Remove trailing spaces
        line = line.replace(/\s+$/, '');
        // Collapse multiple spaces into single space
        line = line.replace(/\s+/g, ' ');
        return line;
    })
    .filter(line => line.length > 0); // Remove blank lines

    // Join back with newlines, no trailing newline
    return normalizedLines.join('\n');
}

// SHA-256 hash function (works in both browser and Node.js)
function sha256(text) {
    // Node.js environment (for testing)
    if (typeof require !== 'undefined' && typeof window === 'undefined') {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
    }

    // Browser environment (production)
    return (async () => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    })();
}

// Export for Node.js testing (doesn't affect browser usage)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeText, sha256 };
}
