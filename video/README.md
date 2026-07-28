# Landing demo video

Source + tooling for the landing-page hero video consumed by
[`web/src/components/DemoVideo.tsx`](../web/src/components/DemoVideo.tsx). The rendered, drop-in assets
live at `web/public/demo.webm` · `demo.mp4` · `demo-poster.jpg` (muted-autoplay + click-to-replay,
already wired into `LandingScreen`).

## The cut (~44s, product-only)

Entirely real footage of the live product + two on-brand motion cards, under a music bed:

1. **Motto** — *Every day, a little more confident than the day before.* (`motto-scene.html`)
2. **AI interviewer avatar** (Simli talking-head) asks a real question — voice + video
3. **Candidate answers by voice** (mic recording state)
4. **Live evaluation** — real scored feedback with the interviewer avatar present
5. **"Your biggest growth today"** card (`growth-summary.html`)
6. **Motto** close

## Files

| File | What |
|---|---|
| `motto-scene.html` | Animated motto bookend (open + close), 1920×1080, brand-matched |
| `growth-summary.html` | Faked "today's growth" end card (English), animated |
| `landing-video-storyboard.md` | Original creative brief (see note at its top — the shipped cut is product-only) |
| `recordings/record.mjs` | Playwright capture of the live app (avatar interview, report, feedback) |
| `recordings/render-cards.mjs` | Renders the two HTML cards to clips |
| `recordings/generate_music.py` | Synthesizes the background music bed (numpy) |
| `recordings/assemble.sh` | Trims segments + music → `web/public/demo.{webm,mp4}` + poster |

Derived/heavy artifacts (`recordings/clips`, `work`, `frames`, `node_modules`, `audio/`) are gitignored —
regenerate them with the scripts below.

## Regenerate

Requires the local stack running (`docker compose up`, with a real `OPENAI_API_KEY` + `SIMLI_*` in `.env`
for realistic questions and the avatar) and ffmpeg.

```bash
cd video/recordings
npm install                    # playwright
npx playwright install chromium
# 1) seed camera-ready data + enable the avatar on the hero interview (see session notes)
# 2) capture the live app (headed — headless crashes on the Simli WebRTC + recording):
node record.mjs avatar report feedback
node render-cards.mjs          # motto + growth cards → clips
python3 generate_music.py      # music bed → audio/music-bed.wav
bash assemble.sh               # → web/public/demo.{webm,mp4} + demo-poster.jpg
```

## Notes

- **Music** is synthesized (I–V–vi–IV in C major). To use a licensed track instead (Uppbeat / Artlist /
  YouTube Audio Library), drop it in `video/audio/` and point `assemble.sh` at it.
- **Captions** are not yet baked in; the landing autoplays muted, so short per-beat captions are a good
  next step.
- Producing the video needs the running stack; the committed `web/public/demo.*` assets are the shippable
  output and require no rebuild to serve.
