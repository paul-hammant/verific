/*
    Copyright (C) 2026, Paul Hammant

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import { test, expect } from '@playwright/test';
import path from 'path';

// public/text-selection-verify.js drives the in-page Clip-mode simulation on the training
// pages. These assert the signals a reader actually acts on, against a real training page:
// that a claim nothing independent endorses is amber rather than the confirmed green, that
// it says what is missing, and that the hashed text keeps its real line breaks.

const AMBER = 'rgb(255, 183, 77)';

test.describe('in-page clip-mode simulation', () => {
    test.beforeEach(async ({ page }) => {
        // The issuer answers "verified" but publishes no authorizedBy, so this is the
        // self-verified case - the one that used to render as confirmed green.
        await page.route('**/c/**', route => {
            if (route.request().url().includes('verification-meta.json')) {
                return route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: JSON.stringify({
                        issuer: 'Unseen University',
                        authorityBasis: 'Individual — test basis'
                    })
                });
            }
            return route.fulfill({
                status: 200, contentType: 'application/json', body: '{"status":"verified"}'
            });
        });

        await page.goto('file://' + path.resolve('public/training-pages/bachelor-thaumatology.html'));

        await page.evaluate(() => {
            const box = document.querySelector('.certification-box')!;
            const range = document.createRange();
            range.selectNodeContents(box);
            const sel = window.getSelection()!;
            sel.removeAllRanges();
            sel.addRange(range);
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });
        await page.click('#tsv-verify-btn', { timeout: 5000 });
    });

    test('self-verification is amber, never the confirmed green', async ({ page }) => {
        const auth = page.locator('#tsv-authorization');
        await expect(auth).toBeVisible({ timeout: 10000 });
        await expect(auth).toContainText('Self-verified by');
        await expect(auth).toHaveCSS('color', AMBER);
    });

    test('says what is missing, not just that a chain is absent', async ({ page }) => {
        await expect(page.locator('#tsv-authorization'))
            .toContainText('No government or regulator attests');
    });

    test('shows the issuer’s claimed authority', async ({ page }) => {
        await expect(page.locator('#tsv-authority-basis'))
            .toContainText('Authority claimed: Individual — test basis');
    });

    test('hashed text keeps its real line breaks', async ({ page }) => {
        // Soft-wrapping would show line structure that differs from the bytes behind
        // the hash, in the one pane whose job is to show the input exactly.
        await expect(page.locator('#tsv-normalized-text')).toHaveCSS('white-space', 'pre');
    });
});
