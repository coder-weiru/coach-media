#!/usr/bin/env bash
# Assemble the product-only landing cut from the captured clips + motion cards, with a cheerful
# voice-over (generate_narration.sh) under a soft music bed (generate_music.py).
#
# Fixed timeline (~49.8s), scene durations sized to fit the voice-over:
#   s1 motto-open   5.0s   full frame
#   s2 avatar Q     8.6s   zoomed into the interview card
#   s3 answer       5.2s   zoomed into the interview card
#   s4 eval+report 19.0s   zoomed + scroll SLOWED (14s of source stretched to 19s)
#   s5 growth card  7.0s   full frame
#   s6 motto-close  5.0s   full frame
set -euo pipefail
cd "$(dirname "$0")"
C=clips; A=../audio; W=work; mkdir -p "$W"

# Zoom that removes the wasted dark margins around the centred app card: crop a 1120x630 window
# (16:9) around the card, then scale back up to 1080p (~1.7x). Full-frame scenes skip the crop.
ZOOM_AVATAR="crop=1120:630:400:40,scale=1920:1080"
ZOOM_EVAL="crop=1120:630:400:180,scale=1920:1080"
FULL="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080"
FMT="fps=30,format=yuv420p"
ENC=(-c:v libx264 -preset medium -crf 20 -an)

seg () {   # seg <out> <src> <start> <dur> <vfilter>
  ffmpeg -y -loglevel error -ss "$3" -t "$4" -i "$C/$2" -vf "$5,$FMT" "${ENC[@]}" "$W/$1"
}
seg_slow () { # seg_slow <out> <src> <start> <src_dur> <out_dur> <vfilter> — stretch to slow motion
  local pts; pts=$(echo "scale=6; $5/$4" | bc)
  ffmpeg -y -loglevel error -ss "$3" -t "$4" -i "$C/$2" \
    -vf "$6,setpts=${pts}*PTS,$FMT" "${ENC[@]}" -t "$5" "$W/$1"
}

echo "cutting video segments…"
seg      s1.mp4 00-motto-open.webm        0.4  5.0  "$FULL"          # motto open
seg      s2.mp4 01-avatar-interview.webm  12.5 8.6  "$ZOOM_AVATAR"   # avatar asks the question
seg      s3.mp4 01-avatar-interview.webm  23.5 5.2  "$ZOOM_AVATAR"   # candidate answers by voice
seg_slow s4.mp4 01-avatar-interview.webm  43.0 14.0 19.0 "$ZOOM_EVAL" # evaluation + report (slowed)
seg      s5.mp4 06-growth.webm            0.6  7.0  "$FULL"          # "today's biggest growth" card
seg      s6.mp4 09-motto-close.webm       0.4  5.0  "$FULL"          # motto close

echo "concatenating video…"
printf "file '%s'\n" s1.mp4 s2.mp4 s3.mp4 s4.mp4 s5.mp4 s6.mp4 > "$W/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$W/list.txt" -c copy "$W/master_silent.mp4"

echo "building narration track (0.5s lead per scene, padded to scene length)…"
narr () { # narr <out> <scene> <dur>
  ffmpeg -y -loglevel error -i "$A/narr-$2.wav" -af "adelay=500|500,apad" -t "$3" -ar 48000 -ac 2 "$W/$1"
}
narr a1.wav 1 5.0; narr a2.wav 2 8.6;  narr a3.wav 3 5.2
narr a4.wav 4 19.0; narr a5.wav 5 7.0; narr a6.wav 6 5.0
ffmpeg -y -loglevel error -i "$W/a1.wav" -i "$W/a2.wav" -i "$W/a3.wav" -i "$W/a4.wav" -i "$W/a5.wav" -i "$W/a6.wav" \
  -filter_complex "[0][1][2][3][4][5]concat=n=6:v=0:a=1[a]" -map "[a]" -ar 48000 -ac 2 "$W/narration.wav"

echo "mixing narration over a soft music bed…"
ffmpeg -y -loglevel error -i "$W/narration.wav" -i "$A/music-bed.wav" \
  -filter_complex "[1:a]volume=0.13,atrim=0:50,asetpts=N/SR/TB[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[a]" \
  -map "[a]" -ar 48000 -ac 2 "$W/soundtrack.wav"

echo "muxing video + soundtrack…"
ffmpeg -y -loglevel error -i "$W/master_silent.mp4" -i "$W/soundtrack.wav" \
  -map 0:v -map 1:a -shortest -c:v copy -c:a aac -b:a 192k "$W/master.mp4"

echo "encoding drop-in assets → web/public/mock/…"
PUB=../../web/public/mock
ffmpeg -y -loglevel error -i "$W/master.mp4" -c:v libvpx-vp9 -b:v 0 -crf 33 -c:a libopus -b:a 128k "$PUB/demo.webm"
ffmpeg -y -loglevel error -i "$W/master.mp4" -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$PUB/demo.mp4"
ffmpeg -y -loglevel error -ss 2 -i "$W/master.mp4" -frames:v 1 -q:v 3 "$PUB/demo-poster.jpg"

echo "done:"; ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/master.mp4"
ls -la "$PUB"/demo.* "$PUB"/demo-poster.jpg
