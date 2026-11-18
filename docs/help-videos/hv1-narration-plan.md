# HV1 — Narration for solve.coach help videos: plan

Design and decisions live in Coach: `docs/design/help-videos-design.md` (§4 narration that fits, §6 format) and
`docs/design/phases/help-videos/DECISIONS.md` (HV-7 narrated, HV-10 build order, HV-11 which project pays).

## Goal

Turn each help clip's lines into spoken audio **before** the screen is captured, and record how long each line is, so
the runner (HV2) can wait exactly that long at each step and the voice and the action stay together.

## What it builds

- `video/help/clips/<id>.json` — a clip's script: title, voice, rate, and its lines (`id`, `text`). The text is what
  is said **and** the caption. Clip 1 is `01-type-an-answer` (HV-10's first clip).
- `node video/help/narrate.mjs video/help/clips/01-type-an-answer.json` (or `npm run narrate:help`) makes:
  - `video/help/audio/<key>.wav` — one line, 24 kHz 16-bit mono, from Google Cloud Text-to-Speech, Chirp 3 HD
    **Ms. Ari** (`en-US-Chirp3-HD-Achernar`) at rate **0.95**, the same voice and rate as the app's default tutor
    voice. `<key>` is a hash of the voice, rate and text, so an unchanged line is never made again and a changed one
    gets a new file.
  - `video/help/narration/<id>.json` — `narration.json` for the clip: each line's text, file and `duration_ms`, and
    the total. This is the file HV2 reads.
- `--dry-run` prints which lines would be made, without calling Google.

## Who pays, how it signs in (HV-11)

The call is billed to solve's project, `solve-510201` (`TTS_PROJECT` overrides it), with the builder's own `gcloud`
login: the script asks `gcloud auth print-access-token` for a token and sends the project as the quota project.
No service account key is copied here. Chirp 3 HD bills per character with 1M free a month; a clip is a few hundred.

## Loudness

The design asks for −16 LUFS. Integrated loudness isn't reliable on 2-second lines, so HV1 keeps the lines as they
come and **HV3a normalises the whole narration track once**, at assembly.

## Clip 1 lines

Draft wording, checked against the app's practice screen (the step box, Enter or ✓ to check, a note on each step,
the math keys under the box, a correct answer finishing on any line). HV2 picks the problem (2026-11-18: a square-root equation, so the keys show; the fraction line was dropped). If the problem changes
what a line should say, the line changes and is re-made.

## Done when

`narration/01-type-an-answer.json` exists with a duration for every line; a second run makes nothing; the unit
tests (`node --test video/help`) pass without network.
