# 03 — Growth Journey: Campus + Fable

Outdoor university variant with seven preserved Fable recordings
(`campus-narr-1.mp3` through `campus-narr-7.mp3`), matching HTML/artwork and music.

## Rebuild

From the repository root, after `npm install` and `npx playwright install chromium`:

```sh
npm run assemble:campus
```

Requires ffmpeg/ffprobe and Node.js. Produces a 60-second 1080p MP4, WebM and
poster in the root `exports/` directory. Set `OUTPUT_DIR` to an absolute path to
choose a different destination. Intermediate files live in ignored `clips/` and
`work/` directories beside this README.

Narration starts at 0.7, 6.7, 16.7, 26.7, 36.7, 46.7 and 54.7 seconds.
The music loops to cover 60 seconds, fades in/out, and ducks under the narration.
This rebuild uses the preserved MP3s directly; it needs no TTS service or macOS voice.
The historical `generate_growth_journey_campus_narration.sh` creates **Reed**
speech and is an optional alternative, not part of the Fable workflow.

Committed MP4/WebM/poster files preserve the original handoff. Rebuilds include
current source corrections and may differ from those originals. Review exports
before replacing the separate Coach repo's `web/public/mock/growth-journey-campus.*`.
