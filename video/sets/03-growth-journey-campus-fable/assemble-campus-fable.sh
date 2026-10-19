#!/usr/bin/env bash
# Rebuild the Campus cut from its HTML, preserved Fable recordings and music bed.
set -euo pipefail
cd "$(dirname "$0")"

for tool in node ffmpeg ffprobe; do
  command -v "$tool" >/dev/null || { echo "Required tool missing: $tool" >&2; exit 1; }
done
for input in growth-journey-campus.html growth-journey-campus-triptych.png music-bed.wav campus-narr-{1..7}.mp3; do
  [[ -s "$input" ]] || { echo "Required source missing: $input" >&2; exit 1; }
done
PUB="${OUTPUT_DIR:-../../../exports}"
mkdir -p clips work "$PUB"
node render-growth-journey-campus.mjs

# Align each preserved recording with the scene timeline; no TTS or credentials needed.
inputs=()
for n in 1 2 3 4 5 6 7; do inputs+=( -i "campus-narr-$n.mp3" ); done
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex \
  "[0:a]adelay=700:all=1[a0];[1:a]adelay=6700:all=1[a1];[2:a]adelay=16700:all=1[a2];[3:a]adelay=26700:all=1[a3];[4:a]adelay=36700:all=1[a4];[5:a]adelay=46700:all=1[a5];[6:a]adelay=54700:all=1[a6];[a0][a1][a2][a3][a4][a5][a6]amix=inputs=7:duration=longest:normalize=0,apad,atrim=0:60" \
  -ar 48000 -ac 2 work/campus-narration.wav
ffmpeg -y -loglevel error -stream_loop -1 -i music-bed.wav -t 60 \
  -af 'volume=0.16,afade=t=in:st=0:d=2,afade=t=out:st=56:d=4' \
  -ar 48000 -ac 2 work/campus-music.wav
ffmpeg -y -loglevel error -i work/campus-narration.wav -i work/campus-music.wav \
  -filter_complex '[0:a]asplit=2[voice][control];[1:a][control]sidechaincompress=threshold=0.025:ratio=8:attack=20:release=500[music];[voice][music]amix=inputs=2:duration=first:normalize=0[a]' \
  -map '[a]' -ar 48000 -ac 2 work/campus-soundtrack.wav
ffmpeg -y -loglevel error -i clips/growth-journey-campus-silent.webm -i work/campus-soundtrack.wav \
  -map 0:v:0 -map 1:a:0 -t 60 -c:v libx264 -crf 20 -preset medium \
  -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$PUB/growth-journey-campus.mp4"
ffmpeg -y -loglevel error -i "$PUB/growth-journey-campus.mp4" \
  -c:v libvpx-vp9 -b:v 0 -crf 33 -c:a libopus -b:a 96k "$PUB/growth-journey-campus.webm"
ffmpeg -y -loglevel error -ss 2 -i "$PUB/growth-journey-campus.mp4" \
  -frames:v 1 -q:v 3 "$PUB/growth-journey-campus-poster.jpg"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$PUB/growth-journey-campus.mp4"
echo "Campus/Fable exports → $PUB"
