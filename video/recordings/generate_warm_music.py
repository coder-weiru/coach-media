#!/usr/bin/env python3
"""Create a gentle, piano-like instrumental bed with only the standard library.

The melody is intentionally sparse: it leaves room for Ava's reflection-led narration
and settles into silence at the end of the film.
"""
from array import array
import math
import wave

SR, DURATION, BPM = 48000, 60, 92
BEAT = 60 / BPM
N = SR * DURATION
left, right = array('f', [0.0]) * N, array('f', [0.0]) * N

def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def add_note(midi, start, length, gain, pan=0.0, bell=False):
    start_i, count = int(start * SR), min(int(length * SR), N - int(start * SR))
    if count <= 0:
        return
    frequency = hz(midi)
    for j in range(count):
        t = j / SR
        # A soft piano-like attack, natural decay, and a restrained overtone bloom.
        env = min(1.0, t * 90) * math.exp(-t * (2.35 if bell else 1.65))
        tone = math.sin(2 * math.pi * frequency * t)
        tone += 0.28 * math.sin(4 * math.pi * frequency * t)
        tone += 0.09 * math.sin(6 * math.pi * frequency * t)
        if bell:
            tone += 0.14 * math.sin(2 * math.pi * frequency * 3.01 * t)
        sample = gain * env * tone
        i = start_i + j
        left[i] += sample * (1 - max(0, pan))
        right[i] += sample * (1 + min(0, pan))

# D–A–Bm–G: hopeful but calm. Each chord lasts four beats.
progression = [([62, 66, 69], 50), ([57, 61, 64], 45), ([59, 62, 66], 47), ([55, 59, 62], 43)]
pattern = [0, 2, 1, 2, 0, 1, 2, 1]
for bar in range(23):
    notes, root = progression[bar % len(progression)]
    start = bar * 4 * BEAT
    # Wide, extremely soft chord bed and a gentle bass pulse.
    for idx, note in enumerate(notes):
        add_note(note, start, 3.7 * BEAT, 0.030, -0.16 if idx != 1 else 0.16)
    add_note(root, start, 2.4 * BEAT, 0.052)
    # A sparse eight-note piano figure. It deliberately avoids a busy, corporate feel.
    for step, idx in enumerate(pattern):
        add_note(notes[idx] + 12, start + step * BEAT / 2, 1.25, 0.050, -0.12 if step % 2 else 0.12)
    if bar % 2 == 1:
        add_note(notes[2] + 24, start + 2.5 * BEAT, 1.7, 0.022, 0.10, bell=True)

# Light stereo echo, then an extended release over the final four seconds.
for channel in (left, right):
    for delay, amount in ((int(0.11 * SR), 0.14), (int(0.23 * SR), 0.08)):
        for i in range(N - 1, delay - 1, -1):
            channel[i] += channel[i - delay] * amount
for i in range(N):
    t = i / SR
    fade = min(1, t / 1.5) * min(1, max(0, (DURATION - t) / 4.0))
    left[i] = math.tanh(left[i] * 1.18) * fade
    right[i] = math.tanh(right[i] * 1.18) * fade

pcm = array('h')
for l, r in zip(left, right):
    pcm.extend((int(max(-1, min(1, l)) * 32767), int(max(-1, min(1, r)) * 32767)))
with wave.open('../audio/warm-music-bed.wav', 'wb') as out:
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(SR)
    out.writeframes(pcm.tobytes())
print('wrote ../audio/warm-music-bed.wav')
