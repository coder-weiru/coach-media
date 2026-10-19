# 01 — Product demo

Original product-led landing video, with its recovered source footage, narration,
music and microphone input. Committed `demo.mp4`, `demo.webm` and poster preserve
the original delivery; rebuilds write separately into root `exports/`.

## Offline rebuild

Install ffmpeg/ffprobe and `bc`, then run from the repository root:

```sh
npm run assemble:demo
```

No Coach services, API keys, browser, Python packages or system voice are needed
for this rebuild. The assembler defaults to `sources/footage/` and `sources/sound/`.
It crops/scales the recorded product to 1080p, slows the feedback section, adds
per-scene narration and music, and exports approximately 49.8-second MP4/WebM
files plus a poster. Original capture audio is excluded from the final mix.

Set `OUTPUT_DIR` to an absolute destination. To use newly captured material, set
`CLIPS_DIR` and `AUDIO_DIR` to absolute input directories. Required filenames
and the fixed trim positions are listed in `video/recordings/assemble.sh`.

## Recovered inputs

`sources/manifest.json` records original local paths, byte counts and SHA-256
checksums. These files were recovered on October 19, 2026 from ignored local
files in Coach; the initial tracked-only extraction did not contain them.

- Four WebM inputs: motto open, 60.6-second live avatar interview/answer/report,
  growth card and motto close.
- Six narration WAVs plus the original synthesized music bed.
- `answer.wav`: the recorded candidate response used as Chromium's fake microphone.

These are preserved production inputs, not generated scratch files. Keep them
when cleaning ignored clips/work/audio directories.

## Fresh live capture

The historical recorder targets a development Coach stack with real LLM/Simli
services. It creates users and practice sessions. Fresh capture against the
current Coach version has **not** been verified; it is separate from the proven
offline rebuild above. The original database seed script was not recovered.

1. Start the separate Coach development stack following that repo's instructions.
   Configure development login, LLM/transcription and Simli avatar credentials there.
2. Create/publish a camera-ready interview, make it public and free to practice,
   and enable its avatar. Use that instance's interview UUID as `COACH_HERO_ID`.
   The old hard-coded UUID is no longer assumed to exist.
3. Install this repo's Node dependencies and Playwright Chromium.
4. Run the capture with explicit local targets:

```sh
COACH_API_URL=http://localhost:8000 \
COACH_APP_URL=http://localhost:5200 \
COACH_HERO_ID=<development-interview-uuid> \
node video/recordings/record.mjs avatar
node video/recordings/render-cards.mjs
```

Replace `<development-interview-uuid>` before running. The avatar scene uses the
preserved `sources/answer.wav`; `COACH_ANSWER_WAV` can override it with an absolute
path. Captures go to ignored `video/recordings/clips/`. Report/feedback scenes
need a candidate with completed dashboard sessions; they are not inputs to this
cut, so requesting only `avatar` avoids that seed dependency.

Optionally regenerate narration/music using the historical scripts (macOS `say`
for narration; Python numpy/scipy for music). Then assemble with `CLIPS_DIR`
pointing at the fresh clips and `AUDIO_DIR` pointing at the chosen sound inputs.
Live timing varies: check the question, answer and report positions and adjust
the assembler's trim points before using a fresh capture.
