#!/usr/bin/env bash
# Render the reflection-led landing film and write the assets consumed by LandingV2's DemoVideo.
set -euo pipefail
cd "$(dirname "$0")"
node render-growth-journey.mjs
VOICE="${VOICE:-Ava (Premium)}" bash generate_growth_journey_narration.sh
PUB="${OUTPUT_DIR:-../../exports}"
mkdir -p "$PUB"
SRC=clips/growth-journey-silent.webm
MUSIC=../sets/02-growth-journey-ava/warm-music-bed.wav

# The landing autoplays muted, but the existing sound control can reveal the gentle music bed.
ffmpeg -y -loglevel error -stream_loop -1 -i "$MUSIC" -t 60 -filter:a 'volume=0.16,afade=t=in:st=0:d=2,afade=t=out:st=56:d=4' -ar 48000 -ac 2 work/growth-music.wav
ffmpeg -y -loglevel error -i work/growth-narration.wav -i work/growth-music.wav -filter_complex "[1:a][0:a]sidechaincompress=threshold=0.025:ratio=8:attack=20:release=500[music];[0:a][music]amix=inputs=2:duration=first:normalize=0[a]" -map "[a]" -ar 48000 -ac 2 work/growth-soundtrack.wav
ffmpeg -y -loglevel error -i "$SRC" -i work/growth-soundtrack.wav -map 0:v -map 1:a -shortest -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$PUB/growth-journey.mp4"
ffmpeg -y -loglevel error -i "$PUB/growth-journey.mp4" -c:v libvpx-vp9 -b:v 0 -crf 33 -c:a libopus -b:a 96k "$PUB/growth-journey.webm"
ffmpeg -y -loglevel error -ss 2 -i "$PUB/growth-journey.mp4" -frames:v 1 -q:v 3 "$PUB/growth-journey-poster.jpg"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$PUB/growth-journey.mp4"
