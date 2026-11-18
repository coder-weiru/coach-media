// node --test video/help — assembly's timeline, captions and checks, without ffmpeg.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { checkBudget, checkPairing, filterGraph, timeline, transcript, vtt } from './assemble.mjs';

const narration = { clip: 'c', title: 'Type a math answer', lines: [
  { id: 'intro', text: 'Hello.', file: 'audio/a.wav', duration_ms: 2000 },
  { id: 'finish', text: 'Done.', file: 'audio/b.wav', duration_ms: 1500 },
] };
const cues = { clip: 'c', trim_start_ms: 400, cues: [
  { id: 'intro', start_ms: 900, end_ms: 2900 }, { id: 'finish', start_ms: 3300, end_ms: 4800 },
] };

test('lines land at title + (cue start - trim), and the clip holds 1.5 s after the last line', () => {
  const tl = timeline({ cues, narration, videoMs: 10000 });
  assert.deepEqual(tl.placed.map((p) => [p.id, p.at, p.end]), [['intro', 1500, 3500], ['finish', 3900, 5400]]);
  assert.equal(tl.endMs, 6300);
  assert.equal(tl.totalMs, 1000 + 6300 - 400);
  assert.equal(tl.freezeMs, 0);
  assert.equal(tl.posterMs, 3500); // without a hold: the end of the line before last
});

test('a short capture ends where the video ends', () => {
  assert.equal(timeline({ cues, narration, videoMs: 5000 }).endMs, 5000);
});

test('a cue without narration fails', () => {
  const bad = { ...cues, cues: [...cues.cues, { id: 'keys', start_ms: 5000, end_ms: 6000 }] };
  assert.throws(() => timeline({ cues: bad, narration, videoMs: 9000 }), /no line keys/);
});

test('captions are WebVTT at the spoken times', () => {
  const out = vtt(timeline({ cues, narration, videoMs: 10000 }));
  assert.match(out, /^WEBVTT\n\n1\n00:00:01\.500 --> 00:00:03\.500\nHello\.\n/);
  assert.match(out, /2\n00:00:03\.900 --> 00:00:05\.400\nDone\.\n/);
});

test('the transcript lists the lines in spoken order under the title', () => {
  assert.equal(transcript(timeline({ cues, narration, videoMs: 10000 }), 'T'), 'T\n\nHello.\nDone.\n');
});

test('a capture paced to other narration is refused', () => {
  const bytes = Buffer.from('{"x":1}');
  const sha = createHash('sha256').update(bytes).digest('hex');
  checkPairing({ narration_sha256: sha }, bytes);
  assert.throws(() => checkPairing({ clip: 'c', viewport: 'phone', narration_sha256: 'old' }, bytes), /capture again/);
});

test('over budget fails, within passes', () => {
  checkBudget('phone', { 'a.mp4': 1.4e6 });
  assert.throws(() => checkBudget('phone', { 'a.mp4': 1.6e6 }), /1.5 MB budget/);
  checkBudget('desktop', { 'a.webm': 2.4e6 });
});

test('the filter graph delays each line and normalises loudness once', () => {
  const g = filterGraph(timeline({ cues, narration, videoMs: 10000 }), { width: 390, height: 844 });
  assert.match(g, /\[2:a\]aresample=48000,adelay=1500:all=1\[a0\]/);
  assert.match(g, /\[3:a\]aresample=48000,adelay=3900:all=1\[a1\]/);
  assert.equal(g.match(/loudnorm/g).length, 1);
  assert.match(g, /concat=n=2:v=1:a=0\[v\]/);
});

test('with a hold, the capture stops there and the frame is held until the narration ends', () => {
  const tl = timeline({ cues: { ...cues, hold_from_ms: 4200 }, narration, videoMs: 10000 });
  assert.equal(tl.endMs, 4200);
  assert.equal(tl.freezeMs, 6300 - 4200);
  assert.equal(tl.totalMs, 1000 + 6300 - 400);
  assert.equal(tl.posterMs, 1000 + 4200 - 400 - 40);
  assert.match(filterGraph(tl, { width: 390, height: 844 }), /tpad=stop_mode=clone:stop_duration=2\.100\[cap\]/);
});
