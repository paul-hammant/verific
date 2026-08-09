/*
    Copyright (C) 2025, Paul Hammant

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

// The front-page demo runs the real Live Verify pipeline (extract verify: line ->
// normalize -> SHA-256 -> build the URL) and then STOPS, handing the reader the issuer's
// address as a link.
//
// It deliberately renders no verdict. A page that adjudicates its own trustworthiness is
// worthless as evidence, because any page can draw a green tick - including a copy of this
// one made by somebody else. So these tests assert the opposite of what a verification test
// usually asserts: that the page computes the right address, and never claims an answer.

const PRISTINE_HASH =
  '10a05837abbcf6f3533df418855a7cd513a7feb7d4f347f28853d9c4be2bc76f';

const ISSUER_PREFIX = 'https://live-verify.github.io/live-verify/c/';

test.describe('front-page lookup-builder demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + path.resolve('public/index.html'));
  });

  test('builds the issuer lookup URL for the pristine claim', async ({ page }) => {
    await page.click('#demoVerifyBtn');
    const result = page.locator('#demoResult');
    await expect(result).toBeVisible();
    await expect(result).toHaveClass(/is-lookup/);

    // The address is the deliverable, and it must be a real link the reader can follow -
    // the answer has to arrive in their own address bar, from the issuer's domain.
    const link = result.locator('a.demo-url');
    await expect(link).toHaveAttribute('href', ISSUER_PREFIX + PRISTINE_HASH);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('never renders a verdict of its own', async ({ page }) => {
    await page.click('#demoVerifyBtn');
    const result = page.locator('#demoResult');

    // The whole point: no pass, no fail, no tick. If a future edit reintroduces one, this
    // fails - which is the intent.
    await expect(result).not.toHaveClass(/is-verified/);
    await expect(result).not.toHaveClass(/is-failed/);
    await expect(result).not.toContainText('✅');
    await expect(result).not.toContainText('Verified');
    await expect(result).not.toContainText('Fails verification');
  });

  test('editing one character produces a different address', async ({ page }) => {
    await page.click('#demoVerifyBtn');
    const pristineHref = await page.locator('#demoResult a.demo-url').getAttribute('href');

    await page.evaluate(() => {
      const doc = document.getElementById('demoDoc')!;
      doc.innerText = doc.innerText.replace('1:47:32', '1:47:33');
    });
    await page.click('#demoVerifyBtn');

    const editedHref = await page.locator('#demoResult a.demo-url').getAttribute('href');
    expect(editedHref).not.toBe(pristineHref);
    expect(editedHref).toContain(ISSUER_PREFIX);
    expect(editedHref).not.toContain(PRISTINE_HASH);

    // Restore button appears once the claim has been edited.
    await expect(page.locator('#demoRestoreBtn')).toBeVisible();
  });

  test('restore brings back the pristine claim and its original address', async ({ page }) => {
    await page.evaluate(() => {
      const doc = document.getElementById('demoDoc')!;
      doc.innerText = doc.innerText.replace('Jordan Avery', 'Jordan Averyx');
    });
    await page.click('#demoVerifyBtn');
    await expect(page.locator('#demoResult a.demo-url')).not.toHaveAttribute(
      'href', ISSUER_PREFIX + PRISTINE_HASH);

    await page.click('#demoRestoreBtn');
    await expect(page.locator('#demoRestoreBtn')).toBeHidden();
    await expect(page.locator('#demoResult')).toBeHidden();

    await page.click('#demoVerifyBtn');
    await expect(page.locator('#demoResult a.demo-url')).toHaveAttribute(
      'href', ISSUER_PREFIX + PRISTINE_HASH);
  });

  test('a claim with no verify: line is refused, not guessed at', async ({ page }) => {
    await page.evaluate(() => {
      const doc = document.getElementById('demoDoc')!;
      doc.innerText = 'Riverside Athletics Club confirms that\nJordan Avery ran.';
    });
    await page.click('#demoVerifyBtn');

    const result = page.locator('#demoResult');
    await expect(result).toHaveClass(/is-error/);
    await expect(result).toContainText('No verify: line found');
    await expect(result.locator('a.demo-url')).toHaveCount(0);
  });
});
