# Video extraction

## Source and scope

Imported tracked `video/` files from Coach at
`6afc7dd936beb179f5727757b3d84b9da299cf80` on October 19, 2026.
Git fast-export/fast-import retained four video-related commits, their authors,
dates and messages; commit IDs changed because unrelated paths were filtered.
Original `video/` layout is retained. No ignored local files were copied.

Coach's source files, served videos, UI and deployment configuration remain
unchanged. Removal of production sources from Coach is a later migration slice.

## Portability changes

- Assembly writes to local `exports/`, configurable with absolute `OUTPUT_DIR`.
- Live capture URLs are configurable through `COACH_API_URL` and `COACH_APP_URL`.
- Delivery-set HTML and renderer paths resolve to their adjacent artwork/source.
- The Ava set uses its committed music bed and stores generated audio locally.
- Root Node dependencies support both shared and set renderers.

## Reproduction gaps

- Original product-demo clips, answer.wav and seed/session instructions are not
  tracked. Existing final delivery assets are preserved; a fresh product render
  requires recapturing and documenting those inputs.
- Campus/Fable assembly now uses the seven preserved MP3s and music bed via
  `npm run assemble:campus`. The historical Reed generator is an optional
  alternative and is not used by that workflow.
- Ava regeneration needs macOS Ava (Premium). Capture requires the separate Coach
  stack and configured LLM/Simli services.

## Verification

Imported delivery media is byte-identical to Coach's tracked files. Shell and
JavaScript syntax and local HTML artwork references were checked. After installing ffmpeg/ffprobe and Playwright Chromium, all six preserved video
files and nine audio files decoded without errors. The Ava workflow rebuilt a
60-second 1080p MP4/WebM and poster; product motion cards and the Campus renderer
also ran successfully. Full product-demo regeneration still has the reproduction gaps listed above.

Closing-transition correction: scene durations now follow the actual 6/10/10/10/
10/8/6-second timeline. Chromium checks at 50 ms intervals across all four shared
and delivery-set HTML sources confirmed that text scenes never overlap. The
outgoing scene fades out before the next fades in. These HTML animations play
once through the 60-second film; reload the page to replay. Updated review
exports are generated locally under `exports/`; preserved delivery-set binaries
remain the original handoff assets until a reviewed replacement is selected.

Campus/Fable follow-up verification: `npm run assemble:campus` rebuilt both
60-second 1080p exports from the preserved MP3s, music, HTML and artwork.
Both formats decoded fully without errors. Narration clips do not overlap;
the mixed soundtrack peaks at -4.7 dBFS. No macOS narration generator or existing
final-video audio was used for this rebuild.
