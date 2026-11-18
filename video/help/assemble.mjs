#!/usr/bin/env node
// Help-video assembly (solve.coach help videos, HV3a). Plan: docs/help-videos/hv3a-assembly-plan.md
//
//   node video/help/assemble.mjs 01-type-an-answer [--viewport desktop|phone|both]
//
// capture (HV2) + narration (HV1) -> exports/help/<clip>-<viewport>.{mp4,webm,vtt,jpg} and <clip>.txt
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
export const TITLE_MS = 1000;
export const HOLD_MS = 1500;
export const BUDGET = { desktop: 2.5e6, phone: 1.5e6 };
const FPS = 25;

/** Where everything sits in the finished clip, in ms from its start. */
export function timeline({ cues, narration, videoMs, titleMs = TITLE_MS, holdMs = HOLD_MS }) {
  const lines = new Map(narration.lines.map((l) => [l.id, l]));
  const trim = cues.trim_start_ms;
  const last = cues.cues[cues.cues.length - 1];
  const speechEnd = last.end_ms + holdMs;
  // `hold_from_ms` (HV2): the frame to end on, e.g. the solved screen before the app moves on. The capture stops
  // there and that frame is held until the narration has finished.
  const holdFrom = cues.hold_from_ms;
  const endMs = Math.min(videoMs, holdFrom ?? speechEnd);
  if (endMs <= trim) throw new Error('capture ends before its first line');
  const finalMs = holdFrom == null ? endMs : Math.max(endMs, speechEnd);
  const placed = cues.cues.map((c) => {
    const line = lines.get(c.id);
    if (!line) throw new Error(`narration has no line ${c.id}`);
    const at = titleMs + c.start_ms - trim;
    return { id: c.id, text: line.text, file: line.file, at, end: at + line.duration_ms };
  });
  const totalMs = titleMs + finalMs - trim;
  return { trimMs: trim, endMs, titleMs, totalMs, freezeMs: finalMs - endMs, placed,
    posterMs: holdFrom == null ? Math.max(titleMs, placed[placed.length - 2]?.end ?? titleMs)
      : titleMs + endMs - trim - 40 };
}

const stamp = (ms) => {
  const t = Math.max(0, Math.round(ms));
  const h = Math.floor(t / 3600000), m = Math.floor((t % 3600000) / 60000), s = Math.floor((t % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(t % 1000).padStart(3, '0')}`;
};

/** WebVTT captions: one cue per line, at the time it's spoken. */
export function vtt(tl) {
  return 'WEBVTT\n\n' + tl.placed.map((p, i) => `${i + 1}\n${stamp(p.at)} --> ${stamp(p.end)}\n${p.text}\n`).join('\n');
}

export function transcript(tl, title) {
  return `${title}\n\n` + tl.placed.map((p) => p.text).join('\n') + '\n';
}

/** The capture must have been paced to the narration on disk now. */
export function checkPairing(manifest, narrationBytes) {
  const sha = createHash('sha256').update(narrationBytes).digest('hex');
  if (manifest.narration_sha256 !== sha)
    throw new Error(`capture ${manifest.clip}-${manifest.viewport} was paced to other narration; capture again (HV2)`);
}

export function checkBudget(viewport, sizes) {
  const over = Object.entries(sizes).filter(([, bytes]) => bytes > BUDGET[viewport]);
  if (over.length) throw new Error(`over the ${BUDGET[viewport] / 1e6} MB budget: ${over.map(([f, b]) => `${f} ${(b / 1e6).toFixed(2)} MB`).join(', ')}`);
}

/** ffmpeg's filter graph: card + trimmed capture, narration lines delayed into place, one loudness pass. */
export function filterGraph(tl, { width, height }) {
  const freeze = tl.freezeMs > 0 ? `,tpad=stop_mode=clone:stop_duration=${(tl.freezeMs / 1000).toFixed(3)}` : '';
  const v = `[0:v]scale=${width}:${height},fps=${FPS},format=yuv420p,setsar=1[card];`
    + `[1:v]fps=${FPS},scale=${width}:${height},format=yuv420p,setsar=1${freeze}[cap];[card][cap]concat=n=2:v=1:a=0[v]`;
  const delays = tl.placed.map((p, i) => `[${i + 2}:a]aresample=48000,adelay=${Math.round(p.at)}:all=1[a${i}]`).join(';');
  const mix = tl.placed.map((_, i) => `[a${i}]`).join('')
    + `amix=inputs=${tl.placed.length}:normalize=0:duration=longest,apad=whole_dur=${(tl.totalMs / 1000).toFixed(3)},`
    + `atrim=0:${(tl.totalMs / 1000).toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,aformat=channel_layouts=mono[a]`;
  return `${v};${delays};${mix}`;
}

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const probeMs = (file) => Math.round(1000 * Number(execFileSync('ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim()));

async function renderCard(title, size, out) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: size });
  const big = Math.round(Math.min(size.width / 12, 64));
  await page.setContent(`<html><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;
    justify-content:center;background:#F8FAFC;color:#14213D;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
    text-align:center;padding:0 8vw;box-sizing:border-box">
    <div style="font-size:${Math.round(big * 0.42)}px;font-weight:700;letter-spacing:.02em;color:#C2410C">solve.coach</div>
    <div style="font-size:${big}px;font-weight:800;line-height:1.15;margin-top:${Math.round(big * 0.3)}px"></div></body></html>`);
  await page.locator('div').nth(1).evaluate((el, t) => { el.textContent = t; }, title);
  await page.screenshot({ path: out });
  await browser.close();
}

export async function assemble(clipId, viewport, { root = HERE, out = join(REPO, 'exports', 'help'), log = console.log } = {}) {
  const cap = (ext) => join(root, 'captures', `${clipId}-${viewport}${ext}`);
  const narrationPath = join(root, 'narration', `${clipId}.json`);
  const narrationBytes = readFileSync(narrationPath);
  const narration = JSON.parse(narrationBytes);
  const manifest = JSON.parse(readFileSync(cap('.manifest.json'), 'utf8'));
  checkPairing(manifest, narrationBytes);
  const cues = JSON.parse(readFileSync(cap('.cues.json'), 'utf8'));
  const tl = timeline({ cues, narration, videoMs: probeMs(cap('.webm')) });
  const size = manifest.size;
  mkdirSync(out, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), 'help-assemble-'));
  try {
    const card = join(work, 'card.png');
    await renderCard(narration.title, size, card);
    const inputs = ['-loop', '1', '-t', (tl.titleMs / 1000).toFixed(3), '-i', card,
      '-ss', (tl.trimMs / 1000).toFixed(3), '-to', (tl.endMs / 1000).toFixed(3), '-i', cap('.webm'),
      ...tl.placed.flatMap((p) => ['-i', join(root, p.file)])];
    const graph = ['-filter_complex', filterGraph(tl, size), '-map', '[v]', '-map', '[a]', '-ac', '1'];
    const stem = join(out, `${clipId}-${viewport}`);
    ff([...inputs, ...graph, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-tune', 'stillimage',
      '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', `${stem}.mp4`]);
    ff([...inputs, ...graph, '-c:v', 'libvpx-vp9', '-crf', '42', '-b:v', '0', '-row-mt', '1', '-deadline', 'good',
      '-c:a', 'libopus', '-b:a', '48k', `${stem}.webm`]);
    ff(['-ss', (tl.posterMs / 1000).toFixed(3), '-i', `${stem}.mp4`, '-frames:v', '1', '-q:v', '4', `${stem}.jpg`]);
    writeFileSync(`${stem}.vtt`, vtt(tl));
    writeFileSync(join(out, `${clipId}.txt`), transcript(tl, narration.title));
    const sizes = Object.fromEntries(['mp4', 'webm'].map((e) => [`${clipId}-${viewport}.${e}`, statSync(`${stem}.${e}`).size]));
    checkBudget(viewport, sizes);
    log(`${clipId}-${viewport}: ${(tl.totalMs / 1000).toFixed(1)} s, ` +
      Object.entries(sizes).map(([f, b]) => `${f.split('.').pop()} ${(b / 1e6).toFixed(2)} MB`).join(', '));
    return { tl, sizes };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const clip = args.find((a) => !a.startsWith('--'));
  const i = args.indexOf('--viewport');
  const which = i >= 0 ? args[i + 1] : 'both';
  if (!clip || !['desktop', 'phone', 'both'].includes(which)) {
    console.error('usage: node video/help/assemble.mjs <clip-id> [--viewport desktop|phone|both]');
    process.exit(2);
  }
  for (const vp of which === 'both' ? ['desktop', 'phone'] : [which]) await assemble(clip, vp);
}
