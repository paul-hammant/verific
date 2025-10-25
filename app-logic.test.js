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

// Mock canvas for testing (avoids need for jsdom)
class MockCanvas {
    constructor() {
        this.width = 0;
        this.height = 0;
    }
    getContext() {
        return {
            translate: jest.fn(),
            rotate: jest.fn(),
            drawImage: jest.fn()
        };
    }
}

// Mock document.createElement for canvas
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return new MockCanvas();
        }
        throw new Error(`Unexpected createElement: ${tag}`);
    }
};

const {
    rotateCanvas,
    extractVerificationUrl,
    extractCertText,
    hashMatchesUrl
} = require('./public/app-logic.js');

describe('App Logic - Pure Functions', () => {
    describe('rotateCanvas', () => {
        let sourceCanvas;

        beforeEach(() => {
            sourceCanvas = new MockCanvas();
            sourceCanvas.width = 100;
            sourceCanvas.height = 200;
        });

        it('should preserve dimensions at 0 degrees', () => {
            const rotated = rotateCanvas(sourceCanvas, 0);
            expect(rotated.width).toBe(100);
            expect(rotated.height).toBe(200);
        });

        it('should swap dimensions at 90 degrees', () => {
            const rotated = rotateCanvas(sourceCanvas, 90);
            expect(rotated.width).toBe(200);
            expect(rotated.height).toBe(100);
        });

        it('should preserve dimensions at 180 degrees', () => {
            const rotated = rotateCanvas(sourceCanvas, 180);
            expect(rotated.width).toBe(100);
            expect(rotated.height).toBe(200);
        });

        it('should swap dimensions at 270 degrees', () => {
            const rotated = rotateCanvas(sourceCanvas, 270);
            expect(rotated.width).toBe(200);
            expect(rotated.height).toBe(100);
        });

        it('should normalize 360 degrees to 0', () => {
            const rotated = rotateCanvas(sourceCanvas, 360);
            expect(rotated.width).toBe(100);
            expect(rotated.height).toBe(200);
        });

        it('should normalize 450 degrees to 90', () => {
            const rotated = rotateCanvas(sourceCanvas, 450);
            expect(rotated.width).toBe(200);
            expect(rotated.height).toBe(100);
        });

        it('should normalize negative degrees (-90 = 270)', () => {
            const rotated = rotateCanvas(sourceCanvas, -90);
            expect(rotated.width).toBe(200);
            expect(rotated.height).toBe(100);
        });

        it('should normalize negative degrees (-180)', () => {
            const rotated = rotateCanvas(sourceCanvas, -180);
            expect(rotated.width).toBe(100);
            expect(rotated.height).toBe(200);
        });

        it('should return a new canvas instance', () => {
            const rotated = rotateCanvas(sourceCanvas, 90);
            expect(rotated).not.toBe(sourceCanvas);
        });
    });

    describe('extractVerificationUrl', () => {
        it('should extract URL from last line', () => {
            const rawText = `Unseen University
College of High Energy Magic
Doctor of Philosophy
https://paul-hammant.github.io/verific/c`;

            const result = extractVerificationUrl(rawText);
            expect(result.url).toBe('https://paul-hammant.github.io/verific/c');
            expect(result.urlLineIndex).toBe(3);
        });

        it('should remove spaces from URL', () => {
            const rawText = `Some certification text
https://paul-hammant.github.io /verific/c`;

            const result = extractVerificationUrl(rawText);
            expect(result.url).toBe('https://paul-hammant.github.io/verific/c');
        });

        it('should remove all spaces from URL line', () => {
            const rawText = `Text
h t t p s : / / e x a m p l e . c o m`;

            const result = extractVerificationUrl(rawText);
            expect(result.url).toBe('https://example.com');
        });

        it('should handle trailing blank lines', () => {
            const rawText = `Certification
https://example.com


`;

            const result = extractVerificationUrl(rawText);
            expect(result.url).toBe('https://example.com');
            expect(result.urlLineIndex).toBe(1);
        });

        it('should throw error if no text found', () => {
            const rawText = '';
            expect(() => extractVerificationUrl(rawText)).toThrow('No text found in image');
        });

        it('should throw error if only whitespace', () => {
            const rawText = '   \n  \n  ';
            expect(() => extractVerificationUrl(rawText)).toThrow('No text found in image');
        });

        it('should throw error if last line does not start with https', () => {
            const rawText = `Certification text
This is not a URL`;

            expect(() => extractVerificationUrl(rawText))
                .toThrow('Bottom line inside the marks must be a verification URL starting with https');
        });

        it('should accept HTTPS in any case', () => {
            const rawText = `Text
HTTPS://EXAMPLE.COM`;

            const result = extractVerificationUrl(rawText);
            expect(result.url).toBe('HTTPS://EXAMPLE.COM');
        });

        it('should handle http (not https) and throw error', () => {
            const rawText = `Text
http://example.com`;

            expect(() => extractVerificationUrl(rawText))
                .toThrow('Bottom line inside the marks must be a verification URL starting with https');
        });
    });

    describe('extractCertText', () => {
        it('should extract text before URL line', () => {
            const rawText = `Line 1
Line 2
Line 3
https://example.com`;

            const result = extractCertText(rawText, 3);
            expect(result).toBe('Line 1\nLine 2\nLine 3');
        });

        it('should remove trailing blank lines from cert text', () => {
            const rawText = `Line 1
Line 2


https://example.com`;

            const result = extractCertText(rawText, 4);
            expect(result).toBe('Line 1\nLine 2');
        });

        it('should handle cert text with no trailing blanks', () => {
            const rawText = `Line 1
Line 2
https://example.com`;

            const result = extractCertText(rawText, 2);
            expect(result).toBe('Line 1\nLine 2');
        });

        it('should handle single line cert text', () => {
            const rawText = `Single Line
https://example.com`;

            const result = extractCertText(rawText, 1);
            expect(result).toBe('Single Line');
        });

        it('should handle empty cert text (URL on first line)', () => {
            const rawText = `https://example.com`;

            const result = extractCertText(rawText, 0);
            expect(result).toBe('');
        });

        it('should preserve blank lines within cert text', () => {
            const rawText = `Line 1

Line 3
https://example.com`;

            const result = extractCertText(rawText, 3);
            expect(result).toBe('Line 1\n\nLine 3');
        });
    });

    describe('hashMatchesUrl', () => {
        const hash = '09d1e6765c2dbd833e5a1f4770d9f0c9368224f7b1aed34de7a3bd5bf4d1f031';

        it('should return true when hash is in URL', () => {
            const url = `https://example.com/c/${hash}`;
            expect(hashMatchesUrl(url, hash)).toBe(true);
        });

        it('should return false when hash is not in URL', () => {
            const url = 'https://example.com/c/differenthash123';
            expect(hashMatchesUrl(url, hash)).toBe(false);
        });

        it('should return false for empty URL', () => {
            expect(hashMatchesUrl('', hash)).toBe(false);
        });

        it('should handle partial hash matches correctly', () => {
            const partialHash = '09d1e676';
            const url = `https://example.com/c/${hash}`;
            expect(hashMatchesUrl(url, partialHash)).toBe(true);
        });

        it('should be case sensitive', () => {
            const upperHash = hash.toUpperCase();
            const url = `https://example.com/c/${hash}`;
            expect(hashMatchesUrl(url, upperHash)).toBe(false);
        });
    });
});
