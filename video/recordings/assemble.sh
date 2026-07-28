#!/usr/bin/env bash
# Assemble the product-only landing cut from the captured clips + motion cards + narration.
set -euo pipefail
cd "$(dirname "$0")"
C=clips; A=../audio; W=work; mkdir -p $W
V="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,format=yuv420p"
SILENT="-f lavfi -i anullsrc=r=48000:cl=stereo"

# seg(out, src, start, dur, [narration])
mkseg () { # video-only segment with silent audio
  ffmpeg -y -loglevel error -ss "$3" -t "$4" -i "$C/$2" $SILENT \
    -vf "$V" -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 \
    -c:a aac -ar 48000 -ac 2 -t "$4" "$W/$1"
}
mkseg_narr () { # video segment with narration audio mixed in
  ffmpeg -y -loglevel error -ss "$3" -t "$4" -i "$C/$2" -i "$A/feedback-narration.wav" \
    -vf "$V" -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 \
    -c:a aac -ar 48000 -ac 2 -t "$4" "$W/$1"
}

echo "cutting segments…"
mkseg      s1.mp4 00-motto-open.webm        0.4  4.8      # motto open
mkseg      s2.mp4 01-avatar-interview.webm  12.5 8.0      # avatar asks the question (voice+video)
mkseg      s3.mp4 01-avatar-interview.webm  23.5 5.0      # candidate answers by voice (recording)
mkseg      s4.mp4 01-avatar-interview.webm  43.0 14.0     # evaluation + feedback (no voice)
mkseg      s5.mp4 06-growth.webm            0.6  7.6      # "today's biggest growth" card
mkseg      s6.mp4 09-motto-close.webm       0.4  4.8      # motto close

echo "concatenating…"
printf "file '%s'\n" s1.mp4 s2.mp4 s3.mp4 s4.mp4 s5.mp4 s6.mp4 > $W/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $W/list.txt -c copy $W/master_silent.mp4

echo "adding happy music bed…"
ffmpeg -y -loglevel error -i $W/master_silent.mp4 -i "$A/music-bed.wav" \
  -map 0:v -map 1:a -shortest -c:v copy -c:a aac -b:a 192k $W/master.mp4

echo "encoding drop-in assets → web/public/…"
PUB=../../web/public
ffmpeg -y -loglevel error -i $W/master.mp4 -c:v libvpx-vp9 -b:v 0 -crf 33 -c:a libopus -b:a 128k "$PUB/demo.webm"
ffmpeg -y -loglevel error -i $W/master.mp4 -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$PUB/demo.mp4"
ffmpeg -y -loglevel error -ss 2 -i $W/master.mp4 -frames:v 1 -q:v 3 "$PUB/demo-poster.jpg"

echo "done:"; ffprobe -v error -show_entries format=duration -of csv=p=0 $W/master.mp4
ls -la "$PUB"/demo.* "$PUB"/demo-poster.jpg
