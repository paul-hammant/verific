import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function listPngs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>f.endsWith('.png')).map(f=>path.join(dir,f));
}

async function loadImageAndDetect(page, pngPath: string) {
  await page.goto('file://' + path.resolve('e2e/cv-harness.html'));
  await page.evaluate(() => window.waitForCv());

  const buf = fs.readFileSync(pngPath);
  const dataUrl = 'data:image/png;base64,' + buf.toString('base64');
  return await page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
    const canvas = document.getElementById('off') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const res = await (window as any).detectSquaresFromCanvas(canvas);
    return { ok: res.ok, corners: res.corners, w: canvas.width, h: canvas.height };
  }, dataUrl);
}

test.describe('OpenCV.js detection on fixtures', () => {
  const shouldDetect = listPngs('test/fixtures/should-detect');
  const shouldNotDetect = listPngs('test/fixtures/should-not-detect');
  const mixed = listPngs('test/fixtures/mixed');

  for (const png of shouldDetect) {
    test(path.basename(png), async ({ page }) => {
      const res = await loadImageAndDetect(page, png);
      expect(res.ok).toBeTruthy();
      expect(res.corners?.length).toBe(4);
    });
  }

  for (const png of mixed) {
    test(path.basename(png), async ({ page }) => {
      const res = await loadImageAndDetect(page, png);
      expect(res.ok).toBeTruthy();
      expect(res.corners?.length).toBe(4);
    });
  }

  for (const png of shouldNotDetect) {
    test(path.basename(png), async ({ page }) => {
      const res = await loadImageAndDetect(page, png);
      expect(res.ok).toBeFalsy();
    });
  }
});

