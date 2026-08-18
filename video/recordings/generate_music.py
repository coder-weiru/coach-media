#!/usr/bin/env python3
"""Synthesize a warm, uplifting background bed (I–V–vi–IV in C major) for the landing video.
Soft pad + gentle arpeggio + soft bass, light reverb, fades. ~46s. Output: ../audio/music-bed.wav
"""
import numpy as np
from scipy.io import wavfile

SR = 48000
BPM = 112.0
BEAT = 60.0 / BPM            # 0.625s
BAR = 4 * BEAT               # one chord per bar
EIGHTH = BEAT / 2

def midi_to_freq(m): return 440.0 * 2 ** ((m - 69) / 12.0)

# I – V – vi – IV in C major: C, G, Am, F  (pad triad notes + bass root)
PROG = [
    ([60, 64, 67], 48),   # C
    ([55, 59, 62], 43),   # G
    ([57, 60, 64], 45),   # Am
    ([53, 57, 60], 41),   # F
]
LOOPS = 6                    # ~52s; the assembly loops it cleanly to the full cut

def adsr(n, a, d, s, r, sus=0.7):
    env = np.ones(n)
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    ai, di, ri = min(ai, n), min(di, n), min(ri, n)
    if ai: env[:ai] = np.linspace(0, 1, ai)
    if di: env[ai:ai + di] = np.linspace(1, sus, di)
    env[ai + di:n - ri] = sus
    if ri: env[n - ri:] = np.linspace(sus, 0, ri)
    return env

def pad_voice(freq, n, detune=0.0):
    t = np.arange(n) / SR
    f = freq * (1 + detune)
    # fundamental + soft upper partials -> warm
    w = (np.sin(2*np.pi*f*t) + 0.45*np.sin(2*np.pi*2*f*t) + 0.22*np.sin(2*np.pi*3*f*t)
         + 0.12*np.sin(2*np.pi*4*f*t))
    return w * adsr(n, 0.35, 0.2, 0.7, 0.45, sus=0.75)

def pluck(freq, n):
    t = np.arange(n) / SR
    # triangle-ish (bright, happy) with a quick plucky decay
    w = (np.sin(2*np.pi*freq*t) + 0.3*np.sin(2*np.pi*2*freq*t) + 0.12*np.sin(2*np.pi*3*freq*t))
    env = np.exp(-t * 6.0) * (1 - np.exp(-t * 400))
    return w * env

def bass_voice(freq, n):
    t = np.arange(n) / SR
    w = np.sin(2*np.pi*freq*t) + 0.25*np.sin(2*np.pi*2*freq*t)
    return w * adsr(n, 0.02, 0.15, 0.6, 0.3, sus=0.6)

total = int(LOOPS * 4 * BAR * SR) + SR
L = np.zeros(total); R = np.zeros(total)

def add(buf_l, buf_r, sig, start, pan=0.0, gain=1.0):
    n = len(sig); e = start + n
    if e > len(buf_l): sig = sig[:len(buf_l) - start]; n = len(sig); e = start + n
    gl = gain * (1 - max(0, pan)); gr = gain * (1 + min(0, pan))
    buf_l[start:e] += sig * gl; buf_r[start:e] += sig * gr

pos = 0
for loop in range(LOOPS):
    for notes, bass in PROG:
        nbar = int(BAR * SR)
        # pad: each chord note, slight L/R detune for width
        for i, m in enumerate(notes):
            f = midi_to_freq(m)
            add(L, R, pad_voice(f, nbar, detune=+0.0009), pos, pan=-0.25, gain=0.16)
            add(L, R, pad_voice(f, nbar, detune=-0.0009), pos, pan=+0.25, gain=0.16)
        # bass root, one octave down
        add(L, R, bass_voice(midi_to_freq(bass), nbar), pos, pan=0.0, gain=0.33)
        # arpeggio: 8 eighth-notes, chord tones up + octave, gentle down-up shape
        arp_notes = notes + [notes[0] + 12]
        pattern = [0, 1, 2, 3, 2, 1, 0, 1]
        for k, idx in enumerate(pattern):
            f = midi_to_freq(arp_notes[idx] + 12)  # up an octave -> sparkle
            npl = int(EIGHTH * SR * 1.6)
            add(L, R, pluck(f, npl), pos + int(k * EIGHTH * SR), pan=(0.15 if k % 2 else -0.15), gain=0.14)
        pos += nbar

# light reverb: a couple of attenuated, slightly-blurred delays
def reverb(x):
    out = x.copy()
    for delay_ms, g in [(53, 0.22), (97, 0.15), (151, 0.09)]:
        d = int(delay_ms / 1000 * SR)
        out[d:] += x[:-d] * g
    return out
L, R = reverb(L), reverb(R)

# soft saturation + normalize + fades
def finish(x):
    x = np.tanh(x * 1.1)
    x /= (np.max(np.abs(x)) + 1e-9); x *= 0.82
    fi, fo = int(1.3 * SR), int(2.6 * SR)
    x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo)
    return x
L, R = finish(L), finish(R)

stereo = np.stack([L, R], axis=1)
wavfile.write('../audio/music-bed.wav', SR, (stereo * 32767).astype(np.int16))
print('wrote ../audio/music-bed.wav', round(len(L)/SR, 1), 's')
