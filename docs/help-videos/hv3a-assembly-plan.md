# HV3a — Assembly for solve.coach help videos: plan

Design and decisions live in Coach: `docs/design/help-videos-design.md` (§2 what people see, §6 format and size) and
`docs/design/phases/help-videos/DECISIONS.md` (HV-4 captions and transcript, HV-7 narration, HV-12 clip 1).

## Goal

Turn a clip's raw capture (HV2, `video/help/captures/`) and its narration (HV1, `video/help/narration/`) into the
files Coach serves: a narrated, captioned video in two formats, with a poster and a transcript.

## What it builds

`node video/help/assemble.mjs 01-type-an-answer [--viewport desktop|phone|both]` (or `npm run assemble:help`) writes
to `exports/help/` (ignored, like the other exports; chosen files go to Coach in a Coach PR):

| File | What |
|---|---|
| `<clip>-<viewport>.mp4` | H.264 + AAC (64 kbit/s mono), `+faststart` |
| `<clip>-<viewport>.webm` | VP9 + Opus (48 kbit/s mono) |
| `<clip>-<viewport>.vtt` | WebVTT captions, one cue per narration line |
| `<clip>-<viewport>.jpg` | the poster: the held frame (the solved screen) |
| `<clip>.txt` | the transcript: every line in spoken order |

## Timeline

- A **1-second title card** first (the clip title on solve.coach's paper and ink colours), rendered to a PNG with
  Playwright, since this ffmpeg has no text filter.
- The capture from its `trim_start_ms` to its `hold_from_ms` (HV2 marks the solved screen there, because the app
  moves on to the next problem a moment later), then that frame **held** until the last line ends plus 1.5 s.
  Without a mark, the capture runs to the last line's end plus 1.5 s.
- Each narration line starts at `1 s + (cue start − trim)`, the same time the capture paced it to. Captions use the
  same times.
- Loudness is normalised **once**, on the whole mixed track: −16 LUFS integrated, −1.5 dBTP.

## Checks

- Size budget (design §6): desktop ≤ 2.5 MB, phone ≤ 1.5 MB, per file. Over budget fails the run.
- The captures' manifest must name the same narration (`narration_sha256`) as the narration file now on disk, so a
  re-worded line can't be laid over an old capture.
- Unit tests (`node --test video/help`) cover the timeline, the captions and the checks without ffmpeg.

## Done when

Clip 1 is exported at both sizes within budget, and a frame and a listen confirm voice, action and captions line up.
