// Records true-1080p .webm clips of the live mock.coach app, one per scene, with a
// visible cursor and human-paced interaction. Usage:  node record.mjs [scene...]
//   scenes: avatar wizard catalog loop report feedback (default: avatar report feedback)
import { chromium } from 'playwright';
import fs from 'node:fs';

const API = process.env.COACH_API_URL || 'http://localhost:8000';
const APP = process.env.COACH_APP_URL || 'http://localhost:5200';
const OUT = new URL('./clips/', import.meta.url).pathname;
const HERO = process.env.COACH_HERO_ID; // Public, free-to-practice interview in the capture instance
fs.mkdirSync(OUT, { recursive: true });

async function tokenFor(email, name) {
  const r = await fetch(`${API}/auth/dev-login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
  if (!r.ok) throw new Error(`Dev login failed: HTTP ${r.status}`);
  const body = await r.json();
  if (!body.access_token) throw new Error('Dev login returned no access token');
  return body.access_token;
}

// A soft, visible cursor that follows real mouse events (Playwright's mouse fires them).
const CURSOR_INIT = (token) => `
  try { localStorage.clear(); localStorage.setItem('coach_token', ${JSON.stringify(token)}); } catch (e) {}
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.id = '__cur';
    c.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;left:0;top:0;'
      + 'margin:-11px 0 0 -11px;border-radius:50%;pointer-events:none;transition:transform .08s ease;'
      + 'background:radial-gradient(circle,rgba(255,255,255,.95) 0%,rgba(138,109,255,.55) 60%,transparent 70%);'
      + 'box-shadow:0 0 14px 4px rgba(109,140,255,.5);';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', e => { c.style.left = e.clientX+'px'; c.style.top = e.clientY+'px'; }, true);
    addEventListener('mousedown', () => c.style.transform = 'scale(.6)', true);
    addEventListener('mouseup',   () => c.style.transform = 'scale(1)', true);
  });
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newScene(browser, token, name) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    permissions: ['microphone'],
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  await context.addInitScript(CURSOR_INIT(token));
  const page = await context.newPage();
  page.on('crash', () => console.log(`  ⚠︎ PAGE CRASHED (${name})`));
  page.on('close', () => console.log(`  ⚠︎ page closed (${name})`));
  page._name = name;
  return { context, page };
}

// Move the cursor smoothly to an element's centre, then click.
async function moveClick(page, selector, { steps = 25, pauseBefore = 350 } = {}) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  const box = await el.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  await sleep(pauseBefore);
  await el.click();
}

async function typeInto(page, selector, text, { delay = 32 } = {}) {
  await moveClick(page, selector, { pauseBefore: 150 });
  await page.fill(selector, '');
  await page.type(selector, text, { delay });
}

async function finish({ context, page }, label) {
  const video = page.video();
  await context.close();               // finalises the .webm
  const src = await video.path();
  const dest = `${OUT}${label}.webm`;
  fs.renameSync(src, dest);
  console.log(`  ✓ ${label}.webm`);
}

// ─── scenes ──────────────────────────────────────────────────────────────
async function sceneWizard(browser) {
  console.log('scene: wizard');
  const maya = await tokenFor('maya.chen@example.com', 'Maya Chen');
  const s = await newScene(browser, maya, 'wizard');
  const { page } = s;
  await page.goto(APP + '/'); await page.waitForLoadState('networkidle'); await sleep(1200);
  await moveClick(page, '[data-testid=interviewer-create]'); await sleep(900);

  await typeInto(page, '[data-testid=wizard-title]', 'Senior Frontend Engineer — React');
  await typeInto(page, '[data-testid=wizard-role]', 'Senior Frontend Engineer');
  await typeInto(page, '[data-testid=wizard-category]', 'Software Engineering');
  await typeInto(page, '[data-testid=wizard-description]',
    'A grounded loop on React architecture, performance and state management.');
  await sleep(900);

  // advance a few steps to show the stepper, then land on Delivery, then publish
  for (let i = 0; i < 4; i++) { await moveClick(page, '[data-testid=wizard-next]', { pauseBefore: 500 }); await sleep(1100); }
  await sleep(1400); // rest on a later step
  await moveClick(page, '[data-testid=wizard-next]', { pauseBefore: 500 }); await sleep(1000);
  await moveClick(page, '[data-testid=wizard-next]', { pauseBefore: 500 }); await sleep(2000); // publish → console
  await finish(s, '01-wizard');
}

async function sceneCatalog(browser) {
  console.log('scene: catalog');
  const alex = await tokenFor('alex.rivera@example.com', 'Alex Rivera');
  const s = await newScene(browser, alex, 'catalog');
  const { page } = s;
  await page.goto(APP + '/browse'); await page.waitForLoadState('networkidle'); await sleep(1800);
  // drift the cursor across the cards, then hover the practice CTA
  await page.mouse.move(600, 400, { steps: 20 }); await sleep(700);
  await page.mouse.move(1100, 520, { steps: 20 }); await sleep(1200);
  const cta = page.getByText(/Practice/i).first();
  if (await cta.count()) { const b = await cta.boundingBox(); if (b) { await page.mouse.move(b.x+b.width/2, b.y+b.height/2, { steps: 20 }); await sleep(1500); } }
  await finish(s, '02-catalog');
}

async function sceneLoop(browser) {
  console.log('scene: interview loop (real LLM — a few slow turns)');
  // fresh candidate so there are always practice attempts available
  const cand = await tokenFor('jordan.kim@example.com', 'Jordan Kim');
  const s = await newScene(browser, cand, 'loop');
  const { page } = s;
  // enter a fresh practice via the invite flow (start server-side, then open the app on it)
  const r1 = await fetch(`${API}/catalog/${HERO}/practice`, { method: 'POST', headers: { Authorization: 'Bearer ' + cand } });
  if (!r1.ok) throw new Error(`Practice creation failed: HTTP ${r1.status}; verify COACH_HERO_ID and free/public availability`);
  const { invite_token } = await r1.json();
  if (!invite_token) throw new Error('Practice creation returned no invite token');
  await page.goto(`${APP}/?invite=${invite_token}`); await page.waitForLoadState('networkidle'); await sleep(2500);
  // the invite screen → start; then answer one question on camera
  const startBtn = page.getByRole('button', { name: /start|practice|begin/i }).first();
  if (await startBtn.count()) { await startBtn.scrollIntoViewIfNeeded(); const b = await startBtn.boundingBox(); if (b){ await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20}); await sleep(400);} await startBtn.click(); }
  await sleep(6000); // wait for the first real question
  await sleep(1500); // let the reader take in the question
  // default is voice ("Tap to answer"); switch to typing
  const typeInstead = page.getByText(/type instead/i).first();
  if (await typeInstead.count()) {
    const b = await typeInstead.boundingBox(); if (b){ await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:18}); await sleep(300); }
    await typeInstead.click(); await sleep(900);
  }
  const ta = page.locator('textarea').first();
  if (await ta.count()) {
    await ta.scrollIntoViewIfNeeded(); const b = await ta.boundingBox(); if (b){ await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:18}); await sleep(300); }
    await ta.click();
    await page.type('textarea',
      'I lazy-load below-the-fold images with the loading="lazy" attribute and an IntersectionObserver '
      + 'for finer control, so the browser only fetches what enters the viewport. That cuts initial '
      + 'payload and improves Largest Contentful Paint on image-heavy pages.', { delay: 24 });
    await sleep(1600);
  }
  await finish(s, '03-loop');
}

async function sceneReport(browser) {
  console.log('scene: report');
  const alex = await tokenFor('alex.rivera@example.com', 'Alex Rivera');
  const s = await newScene(browser, alex, 'report');
  const { page } = s;
  await page.goto(APP + '/'); await page.waitForLoadState('networkidle'); await sleep(1800);
  // open the strong completed session from the dashboard
  const row = page.locator('[data-testid=session-row], .session-row').first();
  if (await row.count()) { const b = await row.boundingBox(); if (b){ await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20}); await sleep(400);} await row.click(); }
  await sleep(2500);
  await finish(s, '04-report');
}

async function sceneFeedback(browser) {
  console.log('scene: feedback (scroll)');
  const alex = await tokenFor('alex.rivera@example.com', 'Alex Rivera');
  const s = await newScene(browser, alex, 'feedback');
  const { page } = s;
  await page.goto(APP + '/'); await page.waitForLoadState('networkidle'); await sleep(1500);
  const row = page.locator('[data-testid=session-row], .session-row').first();
  if (await row.count()) { await row.click(); }
  await sleep(2500);
  for (let y = 0; y < 4; y++) { await page.mouse.wheel(0, 320); await sleep(900); }
  await finish(s, '05-feedback');
}

// The star scene: a live interview with the photorealistic AI interviewer (Simli avatar) + voice,
// then the inline evaluation. Fresh candidate each run so attempts are always available.
async function sceneAvatar(browser) {
  console.log('scene: avatar interview (Simli + voice + evaluation)');
  const email = `candidate.${Date.now()}@example.com`;
  const cand = await tokenFor(email, 'Jordan Kim');
  const s = await newScene(browser, cand, 'avatar');
  const { page } = s;
  const r1 = await fetch(`${API}/catalog/${HERO}/practice`, { method: 'POST', headers: { Authorization: 'Bearer ' + cand } });
  if (!r1.ok) throw new Error(`Practice creation failed: HTTP ${r1.status}; verify COACH_HERO_ID and free/public availability`);
  const { invite_token } = await r1.json();
  if (!invite_token) throw new Error('Practice creation returned no invite token');
  await page.goto(`${APP}/?invite=${invite_token}`); await page.waitForLoadState('networkidle'); await sleep(2500);
  await page.screenshot({ path: OUT + '../frames/avatar-invite.png' }).catch(() => {});
  const startBtn = page.getByRole('button', { name: /start interview/i }).first();
  console.log('    start-interview buttons:', await startBtn.count());
  if (await startBtn.count()) { const b = await startBtn.boundingBox(); if (b){ await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:18}); await sleep(400);} await startBtn.click(); }
  // let the avatar connect + speak the question (Simli WebRTC lip-sync)
  await sleep(13000);
  await page.screenshot({ path: OUT + '../frames/avatar-live.png' }).catch(() => {});
  console.log('    mic-record present:', await page.getByTestId('mic-record').count(), '| question:', await page.getByTestId('question-text').count());
  await page.screenshot({ path: OUT + '../frames/avatar-live2.png' }).catch(() => {});
  const diag = await page.evaluate(() => {
    const el = document.querySelector('[data-testid=mic-record]');
    if (!el) return 'no el';
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    let a = el, hidden = [];
    while (a) { const s = getComputedStyle(a); if (s.display==='none'||s.visibility==='hidden'||s.opacity==='0') hidden.push((a.className||a.tagName)+':'+s.display+'/'+s.visibility+'/'+s.opacity); a = a.parentElement; }
    return { rect: {w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y)}, disp: cs.display, vis: cs.visibility, op: cs.opacity, hiddenAncestors: hidden };
  });
  console.log('    mic diag:', JSON.stringify(diag));

  // ── voice-forward answer: the fake mic plays a real spoken WAV → Whisper → real transcript ──
  // Coordinate-based click via the measured rect — moves the cursor AND sidesteps a Playwright
  // actionability quirk where this button reads as "not visible" despite being fully rendered.
  // Move the cursor to the element (for the recording) then fire a DOM click — robust against the
  // pulse-animation frames where getBoundingClientRect momentarily collapses and Playwright's
  // actionability check bails.
  const clickTid = async (id, pause = 400) => {
    const loc = page.getByTestId(id);
    await loc.waitFor({ state: 'attached', timeout: 30000 }); // attached, not "visible" (avoids the quirk)
    try { const b = await loc.boundingBox(); if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 }); await sleep(pause); } } catch { /* cursor move is best-effort */ }
    await loc.dispatchEvent('click'); // fires the React onClick without any actionability check
  };
  const waitTid = (id, t = 40000) => page.waitForFunction((sel) => !!document.querySelector(`[data-testid=${sel}]`), id, { timeout: t }).catch(() => {});

  await sleep(1200); // let the question settle
  await clickTid('mic-record', 500);        // 🎤 Tap to answer → recording
  await sleep(13000);                        // record while the spoken answer plays ("● Stop recording (Ns)")
  await page.screenshot({ path: OUT + '../frames/avatar-recording.png' }).catch(() => {});
  await clickTid('mic-record', 300);         // stop → Transcribing…
  await waitTid('answer-input');             // the Whisper transcript lands in a review textarea
  await sleep(2500);
  await page.screenshot({ path: OUT + '../frames/avatar-transcript.png' }).catch(() => {});
  await clickTid('answer-submit', 600);
  await sleep(9000); // real LLM evaluation renders
  // have the interviewer READ THE FEEDBACK ALOUD — the avatar speaks the summary while the eval shows
  const readC = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /read feedback aloud/i.test(x.textContent || ''));
    if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (readC) { await page.mouse.move(readC.x, readC.y, { steps: 18 }); await sleep(400); await page.mouse.click(readC.x, readC.y); }
  await sleep(11000); // avatar narrates the feedback (visible speaking glow + lip-sync)
  await page.screenshot({ path: OUT + '../frames/avatar-eval.png' }).catch(() => {});
  await sleep(1500);
  await finish(s, '01-avatar-interview');
}

const ALL = { avatar: sceneAvatar, wizard: sceneWizard, catalog: sceneCatalog, loop: sceneLoop, report: sceneReport, feedback: sceneFeedback };

const want = process.argv.slice(2);
for (const name of want) {
  if (!ALL[name]) throw new Error(`Unknown scene: ${name}. Choose from: ${Object.keys(ALL).join(', ')}`);
}
const run = want.length ? want : ['avatar', 'report', 'feedback'];

if (run.some(name => name === 'avatar' || name === 'loop') && !HERO) {
  throw new Error('Set COACH_HERO_ID to a public, free-to-practice interview in your development instance.');
}
const WAV = process.env.COACH_ANSWER_WAV || new URL('../sets/01-product-demo/sources/answer.wav', import.meta.url).pathname;
if (run.includes('avatar') && !fs.existsSync(WAV)) throw new Error(`Missing microphone source: ${WAV}`);
const browser = await chromium.launch({
  // Headed: the real compositor decodes the Simli WebRTC avatar without crashing the renderer,
  // which headless does ~13s into recording. No slowMo (it stalls the WebRTC event loop).
  headless: false,
  args: [
    '--use-fake-device-for-media-stream',
    `--use-file-for-fake-audio-capture=${WAV}`,
    '--autoplay-policy=no-user-gesture-required',
    '--disable-dev-shm-usage', // avoid /dev/shm exhaustion crashing the renderer under WebRTC + recording
    '--disable-gpu',
  ],
});
for (const name of run) { try { await ALL[name](browser); } catch (e) { console.error(`  ✗ ${name}:`, e.message); process.exitCode = 1; } }
await browser.close();
console.log('done →', OUT);
