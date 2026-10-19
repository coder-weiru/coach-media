import { chromium } from 'playwright';
import fs from 'node:fs';

const out = new URL('./clips/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: out, size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();
await page.goto('file://' + new URL('./growth-journey-campus.html', import.meta.url).pathname);
await page.waitForTimeout(60_000);
const video = page.video();
await context.close();
fs.renameSync(await video.path(), out + 'growth-journey-campus-silent.webm');
await browser.close();
console.log('✓ clips/growth-journey-campus-silent.webm');
