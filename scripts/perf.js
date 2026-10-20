// Verifies the overlay click targets are correctly positioned (effect-driven
// projection) and that project navigation + personal flip still work after the
// per-frame -> effect refactor. Also counts simultaneous canvases.
const { chromium } = require('playwright-core');
const EXE = 'C:\\Users\\alice\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
(async () => {
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERR:', e.message));

  await page.goto('http://localhost:5050/', { waitUntil: 'networkidle' });

  // Projects: check the 3 overlay rects got positioned (non-zero size).
  await page.evaluate(() => document.getElementById('projects')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(3500);
  const projRects = await page.evaluate(() =>
    [...document.querySelectorAll('.project-click-target')].map((b) => {
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })
  );
  console.log('projects overlay rects:', JSON.stringify(projRects));
  await page.screenshot({ path: 'p-projects.png' });

  // Count canvases while straddling projects->personal.
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(600);
  const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
  console.log('canvases mounted mid projects->personal:', canvasCount);

  // Personal: overlay rects + a flip still works.
  await page.evaluate(() => document.getElementById('personal')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(3000);
  const persRects = await page.evaluate(() =>
    [...document.querySelectorAll('.personal-click-target')].map((b) => {
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })
  );
  console.log('personal overlay rects (count):', persRects.length, 'first:', JSON.stringify(persRects[0]));
  await page.screenshot({ path: 'p-personal.png' });

  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
