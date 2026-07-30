#!/usr/bin/env bash
# Generate per-scene voice-over for the landing cut using macOS `say`, as 48k stereo WAVs in ../audio.
# One line per scene (index = scene number in assemble.sh). Swap VOICE/RATE for a different read; a
# warmer, less "robotic" result comes from an Enhanced/Premium system voice — install one via
# System Settings › Accessibility › Spoken Content › Manage Voices, then set VOICE to it.
set -euo pipefail
cd "$(dirname "$0")"
A=../audio; mkdir -p "$A"

VOICE="${VOICE:-Ava (Premium)}"   # warm, natural; install via Manage Voices. Override: VOICE="…"
RATE="${RATE:-178}"               # words per minute — cheerful, unhurried

# Fall back to Samantha if the chosen voice isn't installed, so the pipeline still runs anywhere.
if ! say -v '?' | grep -qF "$VOICE"; then
  echo "  ⚠︎ voice '$VOICE' not installed — falling back to Samantha (install '$VOICE' via" \
       "System Settings › Accessibility › Spoken Content › Manage Voices for the warmer read)"
  VOICE="Samantha"
fi

say_scene () { # say_scene <n> "<text>"
  local n="$1" text="$2" aiff="$A/narr-$1.aiff" wav="$A/narr-$1.wav"
  say -v "$VOICE" -r "$RATE" -o "$aiff" "$text"
  ffmpeg -y -loglevel error -i "$aiff" -ar 48000 -ac 2 "$wav"
  rm -f "$aiff"
  printf "  scene %s: %ss\n" "$n" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$wav")"
}

echo "narration (voice: $VOICE @ ${RATE}wpm)…"
say_scene 1 "mock coach helps you get a little more confident, every single day."
say_scene 2 "Your A.I. interviewer asks a real, role-specific question, out loud, face to face, just like the real thing."
say_scene 3 "You answer by voice, exactly the way you would in a live interview."
say_scene 4 "Seconds later, you get a scored report. It rates your structure, relevance, and communication, then lays out your strengths, the gaps to close, and a stronger sample answer, so you know exactly what to practice next."
say_scene 5 "And here's your biggest growth for the day, so you can watch yourself getting better over time."
say_scene 6 "mock coach. Start free, and walk in ready."
echo "done → $A/narr-*.wav"
