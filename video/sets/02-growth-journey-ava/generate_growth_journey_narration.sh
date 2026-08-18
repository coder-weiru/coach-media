#!/usr/bin/env bash
# Voice-over for the reflection-led Growth Journey landing film.
set -euo pipefail
cd "$(dirname "$0")"
A=../audio
W=work
mkdir -p "$A" "$W"

VOICE="${VOICE:-Ava (Premium)}"
RATE="${RATE:-172}"
if ! say -v '?' | grep -qF "$VOICE"; then
  echo "Ava (Premium) is required for this cut." >&2
  exit 1
fi

line() {
  local n="$1" text="$2" out="$A/growth-narr-$1.wav" aiff="$A/growth-narr-$1.aiff"
  say -v "$VOICE" -r "$RATE" -o "$aiff" "$text"
  ffmpeg -y -loglevel error -i "$aiff" -ar 48000 -ac 2 "$out"
  rm -f "$aiff"
}

line 1 "Tomorrow's interview is on your mind. You know you can do this. You just want to feel ready."
line 2 "Then a difficult question arrives. Not a failure. Just a moment to practice."
line 3 "Afterward, Mock Coach asks: What do you think went better today? You reflect first."
line 4 "Then it meets your insight with evidence. Today, you asked clarifying questions before jumping to a solution."
line 5 "And you leave with one meaningful next step: capacity estimation."
line 6 "A little later, you try again. This time, you know where to begin."
line 7 "A little more confident than yesterday."

inputs=()
for n in 1 2 3 4 5 6 7; do inputs+=( -i "$A/growth-narr-$n.wav" ); done
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex \
  "[0:a]adelay=700|700[a0];[1:a]adelay=6700|6700[a1];[2:a]adelay=16700|16700[a2];[3:a]adelay=26700|26700[a3];[4:a]adelay=36700|36700[a4];[5:a]adelay=46700|46700[a5];[6:a]adelay=54700|54700[a6];[a0][a1][a2][a3][a4][a5][a6]amix=inputs=7:duration=longest:normalize=0,apad,atrim=0:60" \
  -ar 48000 -ac 2 "$W/growth-narration.wav"
echo "✓ Ava (Premium) narration → $W/growth-narration.wav"
