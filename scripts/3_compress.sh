#!/usr/bin/env bash
set -euo pipefail

# Compresses the final PNG sources into CDN-ready assets:
#   AVIF previews (512px, for cards/blur-up) and AVIF q95 sources (2048px).
#
# The 2048px sources use libavif's avifenc (aom) rather than ImageMagick's
# AVIF delegate: at -q 95 -y 444 the output is visually indistinguishable
# from the lossless PNG (dssim < 0.0002) while running ~3x smaller than the
# WebP-lossless sources this pipeline used to emit. See scripts benchmark.
#
# macOS-native: BSD xargs provides the parallelism (no GNU parallel, no
# bash-4 features), and the job count defaults to the machine's core count.
# All paths are absolute, so it can be launched from any directory; override
# via the environment (assets.py sets these from its single CONFIG block).
folder_x="${FINAL_SOURCES:-/Volumes/Storage/Images/1_final-sources}"
folder_y="${AVIF_SOURCES:-/Volumes/Storage/Images/2_compressed-avif-sources}"
folder_z="${AVIF_PREVIEWS:-/Volumes/Storage/Images/3_compressed-avif-previews}"
jobs="${MAX_JOBS:-$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 8)}"

command -v magick >/dev/null 2>&1 || {
  echo "ImageMagick is required (install with 'brew install imagemagick')." >&2
  exit 1
}

command -v avifenc >/dev/null 2>&1 || {
  echo "avifenc is required (install with 'brew install libavif')." >&2
  exit 1
}

[ -d "$folder_x" ] || {
  echo "Source folder not found: $folder_x" >&2
  exit 1
}

mkdir -p "$folder_y" "$folder_z"

# Existence probe via -quit (no pipeline: under pipefail, early-exiting
# consumers like head/grep -q SIGPIPE the find and fail the check).
first_png=$(find "$folder_x" -maxdepth 1 -type f -iname '*.png' -print -quit)
if [ -z "$first_png" ]; then
  echo "No PNGs found in $folder_x"
  exit 0
fi

export folder_y folder_z

# Each worker skips outputs that are newer than their source and rebuilds
# stale ones. A failed file makes the whole pass (and script) exit non-zero,
# but unlike parallel's --halt, in-flight siblings still finish their file.

echo "Compressing AVIF previews with $jobs jobs..."
find "$folder_x" -maxdepth 1 -type f -iname '*.png' -print0 |
  xargs -0 -P "$jobs" -I{} bash -c '
    set -euo pipefail
    file="$1"
    base="${file##*/}"
    base="${base%.*}"
    out="$folder_z/$base.avif"
    # Drop a stale output if the source has changed since it was created.
    [ -e "$out" ] && [ "$file" -nt "$out" ] && rm -f "$out"
    [ -e "$out" ] && exit 0
    magick "$file" -resize 512x512 -quality 90 -strip -filter Lanczos \
      -define avif:codec=aom -define avif:speed=0 "$out"
  ' _ {}

echo "Compressing AVIF q95 sources with $jobs jobs..."
find "$folder_x" -maxdepth 1 -type f -iname '*.png' -print0 |
  xargs -0 -P "$jobs" -I{} bash -c '
    set -euo pipefail
    file="$1"
    base="${file##*/}"
    base="${base%.*}"
    out="$folder_y/$base.avif"
    # Drop a stale output if the source has changed since it was created.
    [ -e "$out" ] && [ "$file" -nt "$out" ] && rm -f "$out"
    [ -e "$out" ] && exit 0
    # avifenc cannot resize, so ImageMagick produces the 2048px pixels into a
    # temp PNG (same Lanczos downscale as the previews) and avifenc encodes it.
    tmp="$folder_y/.$base.tmp.png"
    trap "rm -f \"$tmp\"" EXIT
    magick "$file" -resize 2048x2048 -strip -filter Lanczos "$tmp"
    avifenc -j 1 -s 4 -q 95 -y 444 "$tmp" "$out" >/dev/null
  ' _ {}

echo "Done."
