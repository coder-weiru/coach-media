// Render the motion-graphic HTML cards (motto + growth summary) to 1080p webm clips.
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = new URL('./clips/', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const CARDS = [
  { file: '../motto-scene.html',    out: '00-motto-open.webm',  hold: 8000 },
  { file: '../growth-summary.html', out: '06-growth.webm',      hold: 8500 },
  { file: '../motto-scene.html',    out: '09-motto-close.webm', hold: 8000 },
];

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
for (const c of CARDS) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  const url = 'file://' + new URL(c.file, import.meta.url).pathname;
  await page.goto(url); await sleep(c.hold);
  const video = page.video();
  await context.close();
  fs.renameSync(await video.path(), OUT + c.out);
  console.log('  ✓', c.out);
}
await browser.close();
console.log('done');
