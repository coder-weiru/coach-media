# Coach Media

Video production sources, artwork, narration and delivery sets for Coach.

## Review the finished videos

The three preserved delivery sets are in [`video/sets`](video/sets/README.md).
Open their MP4/WebM files directly; no running Coach services are required.

## Production setup

Requires Node.js, Playwright Chromium, ffmpeg/ffprobe, and Python 3. The original
music generator also uses numpy/scipy. System narration generators require macOS
`say` and the named installed voice.

```sh
npm install
npx playwright install chromium
cd video/recordings
node render-growth-journey.mjs
bash assemble-growth-journey.sh
```

Assembly writes into `exports/` at the repo root. Set `OUTPUT_DIR` to an absolute
path to select another destination. The Ava assembly uses the committed warm
music bed and generates fresh Ava narration. Install Ava (Premium) first.

For other rendering and capture commands, see [`video/README.md`](video/README.md).
Live capture defaults to Coach at ports 8000/5200; override with
`COACH_API_URL` and `COACH_APP_URL`. Capture creates interview/session data and
uses real LLM/avatar services; use a disposable development instance.

## Campus/Fable rebuild

```sh
npm run assemble:campus
```

Uses the seven preserved Fable MP3s and committed music, with no voice-generation
service. See [Campus set](video/sets/03-growth-journey-campus-fable/README.md).

## Delivery to Coach

Review the exports, then copy the chosen MP4, WebM and poster into Coach's
`web/public/mock/` in a separate Coach change. Coach retains its current served
assets and playback implementation. Nothing is automatically deployed here.

## Migration status

See [`docs/migration.md`](docs/migration.md) for provenance, verification and
remaining reproduction gaps.
