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
- Campus delivery includes seven Fable MP3 recordings. Its historical narration
  script generates Reed speech using macOS say. Running it does not reproduce
  Fable. No campus assembly script was present in the source import; preserve
  the supplied final exports until a Fable assembly workflow is implemented.
- Ava regeneration needs macOS Ava (Premium). Capture requires the separate Coach
  stack and configured LLM/Simli services.

## Verification

Imported delivery media is byte-identical to Coach's tracked files. Shell and
JavaScript syntax and local HTML artwork references were checked. Full rendering
and audiovisual review have not run: ffmpeg/ffprobe is unavailable in the current
environment. Extraction is ready for review; production-source deletion and
cutover remain pending those checks.
