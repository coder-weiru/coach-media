#!/usr/bin/env node
// Help-video narration (solve.coach help videos, HV1). Plan: docs/help-videos/hv1-narration-plan.md
//
//   node video/help/narrate.mjs video/help/clips/01-type-an-answer.json [more clips…] [--dry-run]
//
// Each line -> video/help/audio/<key>.wav (Google Cloud Text-to-Speech, Chirp 3 HD), cached by voice + rate + text.
// Each clip -> video/help/narration/<id>.json with every line's duration, for the runner to pace the capture (HV2).
// Billed to TTS_PROJECT (default solve-510201) with the builder's own gcloud login (HV-11); no key file.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = 1; // bump to re-make every line (e.g. a new audio format)
export const RATE_HZ = 24000;
const HERE = dirname(fileURLToPath(import.meta.url));
const TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/** The cache key of one line: anything that changes the audio changes the key. */
export function lineKey({ voice, rate, text }) {
  return createHash('sha256').update(JSON.stringify({ v: VERSION, voice, rate, text, hz: RATE_HZ })).digest('hex').slice(0, 16);
}

/** A clip's script, checked: an id, a voice, a rate, and lines with unique ids and some text. */
export function readClip(path) {
  const clip = JSON.parse(readFileSync(path, 'utf8'));
  if (!clip.id || !clip.voice || typeof clip.rate !== 'number' || !Array.isArray(clip.lines) || !clip.lines.length)
    throw new Error(`${path}: needs id, voice, rate and lines`);
  const seen = new Set();
  for (const l of clip.lines) {
    if (!l.id || !l.text?.trim()) throw new Error(`${path}: every line needs an id and text`);
    if (seen.has(l.id)) throw new Error(`${path}: line id "${l.id}" twice`);
    seen.add(l.id);
  }
  return clip;
}

/** Duration in ms of a 16-bit mono LINEAR16 WAV, read from its header (no ffprobe needed). */
export function wavDurationMs(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV');
  let i = 12, byteRate = 0;
  while (i + 8 <= buf.length) {
    const id = buf.toString('ascii', i, i + 4), size = buf.readUInt32LE(i + 4);
    if (id === 'fmt ') byteRate = buf.readUInt32LE(i + 16);
    if (id === 'data') return Math.round((Math.min(size, buf.length - i - 8) / byteRate) * 1000);
    i += 8 + size + (size & 1);
  }
  throw new Error('WAV has no data chunk');
}

function gcloudToken() {
  return execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
}

/** One line from Google Text-to-Speech, as a WAV (LINEAR16 comes with its header). */
export async function synthesize({ text, voice, rate }, { token = gcloudToken(), project = process.env.TTS_PROJECT || 'solve-510201' } = {}) {
  const r = await fetch(TTS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': project, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text }, voice: { languageCode: voice.slice(0, 5), name: voice },
      audioConfig: { audioEncoding: 'LINEAR16', speakingRate: rate, sampleRateHertz: RATE_HZ } }),
  });
  if (!r.ok) throw new Error(`Text-to-Speech ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return Buffer.from((await r.json()).audioContent, 'base64');
}

/** Make a clip's missing lines and write its narration.json. `synth` is injectable for tests. */
export async function narrate(clipPath, { root = HERE, dryRun = false, synth = synthesize, log = console.log } = {}) {
  const clip = readClip(clipPath);
  const audioDir = join(root, 'audio'), outDir = join(root, 'narration');
  mkdirSync(audioDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  const lines = [];
  let made = 0;
  for (const l of clip.lines) {
    const key = lineKey({ voice: clip.voice, rate: clip.rate, text: l.text });
    const file = join(audioDir, `${key}.wav`);
    if (!existsSync(file)) {
      log(`${dryRun ? 'would make' : 'make'} ${clip.id}/${l.id}: ${l.text}`);
      if (dryRun) continue;
      writeFileSync(file, await synth({ text: l.text, voice: clip.voice, rate: clip.rate }));
      made += 1;
    }
    lines.push({ id: l.id, text: l.text, file: relative(root, file), duration_ms: wavDurationMs(readFileSync(file)) });
  }
  if (dryRun) return { clip: clip.id, made: 0 };
  const out = { clip: clip.id, title: clip.title, voice: clip.voice, rate: clip.rate, version: VERSION, lines,
    total_ms: lines.reduce((s, l) => s + l.duration_ms, 0) };
  writeFileSync(join(outDir, `${clip.id}.json`), JSON.stringify(out, null, 2) + '\n');
  log(`${clip.id}: ${lines.length} lines, ${made} made, ${(out.total_ms / 1000).toFixed(1)} s`);
  return { clip: clip.id, made, total_ms: out.total_ms };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const clips = args.filter((a) => !a.startsWith('--'));
  if (!clips.length) {
    console.error(`usage: node ${basename(process.argv[1])} <clip.json>… [--dry-run]`);
    process.exit(2);
  }
  for (const c of clips) await narrate(c, { dryRun });
}
