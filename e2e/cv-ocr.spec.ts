import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function listPairs(dir: string): { png: string; txt: string | null }[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f=>f.endsWith('.png'))
    .map(png=>{
      const base = png.replace(/\.png$/, '');
      const txt = path.join(dir, base + '.txt');
      return { png: path.join(dir, png), txt: fs.existsSync(txt) ? txt : null };
    });
}

async function loadAndOcr(page, pngPath: string) {
  await page.goto('file://' + path.resolve('e2e/cv-harness.html'));
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js' });
  await page.evaluate(() => (window as any).waitForCv());

  const buf = fs.readFileSync(pngPath);
  const dataUrl = 'data:image/png;base64,' + buf.toString('base64');
  return await page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; (img as any).src = dataUrl; });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = (img as any).width; canvas.height = (img as any).height;
    ctx.drawImage(img as any, 0, 0);
    const det = await (window as any).detectSquaresFromCanvas(canvas);
    if (!det.ok) return { ok:false };
    const cropped = det.croppedCanvas;
    const { data: { text } } = await (window as any).Tesseract.recognize(cropped.toDataURL(), 'eng');
    return { ok:true, text };
  }, dataUrl);
}

test.describe('OCR of cropped region (browser)', () => {
  const roots = [
    'test/fixtures/should-detect',
    'test/fixtures/mixed',
  ];

  for (const root of roots) {
    for (const pair of listPairs(root)) {
      test(path.relative('.', pair.png), async ({ page }) => {
        const res: any = await loadAndOcr(page, pair.png);
        expect(res.ok).toBeTruthy();
        if (pair.txt) {
          const expected = fs.readFileSync(pair.txt, 'utf8').replace(/\r?\n/g, '\\n');
          const actualRaw = (res.text as string).replace(/\r?\n/g, '\\n');
          const actual = actualRaw
            .split('\\n')
            .map(l => l.replace(/^\s+|\s+$/g,'').replace(/\s+/g, ' '))
            .join('\\n');
          expect(actual).toBe(expected);
        }      });
    }
  }

  for (const pair of listPairs('test/fixtures/should-not-detect')) {
    test(path.relative('.', pair.png), async ({ page }) => {
      const res: any = await loadAndOcr(page, pair.png);
      expect(res.ok).toBeFalsy();
    });
  }
});
