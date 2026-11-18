// node --test video/help — no network: the synthesiser is a fake that returns a WAV of a set length.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { lineKey, narrate, RATE_HZ, readClip, wavDurationMs } from './narrate.mjs';

function wav(ms) {
  const data = Buffer.alloc(Math.round((RATE_HZ * 2 * ms) / 1000));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE_HZ, 24); h.writeUInt32LE(RATE_HZ * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

function clipFile(dir, lines) {
  const p = join(dir, 'clip.json');
  writeFileSync(p, JSON.stringify({ id: 'demo', title: 'Demo', voice: 'en-US-Chirp3-HD-Achernar', rate: 0.95, lines }));
  return p;
}

test('the key changes with text, voice or rate, and not otherwise', () => {
  const a = { voice: 'v', rate: 0.95, text: 'Hi' };
  assert.equal(lineKey(a), lineKey({ ...a }));
  assert.notEqual(lineKey(a), lineKey({ ...a, text: 'Hi.' }));
  assert.notEqual(lineKey(a), lineKey({ ...a, voice: 'w' }));
  assert.notEqual(lineKey(a), lineKey({ ...a, rate: 1 }));
});

test('wav duration comes from the header', () => {
  assert.equal(wavDurationMs(wav(1500)), 1500);
  assert.throws(() => wavDurationMs(Buffer.from('nope')));
});

test('a clip needs unique line ids and text', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hv1-'));
  assert.throws(() => readClip(clipFile(dir, [{ id: 'a', text: 'x' }, { id: 'a', text: 'y' }])), /twice/);
  assert.throws(() => readClip(clipFile(dir, [{ id: 'a', text: ' ' }])), /text/);
});

test('narrate makes missing lines once and writes durations', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hv1-'));
  const p = clipFile(dir, [{ id: 'one', text: 'First line.' }, { id: 'two', text: 'Second line.' }]);
  let calls = 0;
  const synth = async ({ text }) => { calls += 1; return wav(text.length * 100); };
  const first = await narrate(p, { root: dir, synth, log: () => {} });
  assert.equal(first.made, 2);
  const out = JSON.parse(readFileSync(join(dir, 'narration', 'demo.json'), 'utf8'));
  assert.deepEqual(out.lines.map((l) => l.duration_ms), [1100, 1200]);
  assert.equal(out.total_ms, 2300);
  assert.match(out.lines[0].file, /^audio\/[0-9a-f]{16}\.wav$/);
  const again = await narrate(p, { root: dir, synth, log: () => {} });
  assert.equal(again.made, 0);
  assert.equal(calls, 2);
});

test('dry run calls nothing and writes no narration', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hv1-'));
  const p = clipFile(dir, [{ id: 'one', text: 'Only line.' }]);
  const r = await narrate(p, { root: dir, dryRun: true, synth: async () => { throw new Error('called'); }, log: () => {} });
  assert.equal(r.made, 0);
});
