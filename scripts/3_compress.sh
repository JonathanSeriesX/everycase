#!/usr/bin/env bash
set -euo pipefail

# Adjust these paths to wherever your sources and outputs live.
folder_x="/Volumes/Storage/Images/1_final-sources"
folder_y="/Volumes/Storage/Images/2_compressed-sources"
folder_z="/Volumes/Storage/Images/3_compressed-avif-previews"
folder_a="/Volumes/Storage/Images/3_compressed-webp-previews"
jobs="${MAX_JOBS:-10}"

command -v parallel >/dev/null 2>&1 || {
  echo "GNU parallel is required (install with 'sudo apt install parallel')."
  exit 1
}

mkdir -p "$folder_y" "$folder_z" "$folder_a"

mapfile -d '' -t png_files < <(find "$folder_x" -maxdepth 1 -type f -iname '*.png' -print0)
if [ ${#png_files[@]} -eq 0 ]; then
  echo "No PNGs found in $folder_x"
  exit 0
fi

export folder_y folder_z folder_a

echo "Compressing AVIF previews with $jobs jobs..."
printf '%s\0' "${png_files[@]}" |
  parallel -0 --jobs "$jobs" --halt soon,fail=1 '
    file="{}"
    base="${file##*/}"
    base="${base%.*}"
    out="$folder_z/$base.avif"
    [ -e "$out" ] && exit 0
    magick "$file" -resize 512x512 -quality 90 -strip -filter Lanczos \
      -define avif:codec=aom -define avif:speed=0 "$out"
  '

echo "Compressing WebP sources with $jobs jobs..."
printf '%s\0' "${png_files[@]}" |
  parallel -0 --jobs "$jobs" --halt soon,fail=1 '
    file="{}"
    base="${file##*/}"
    base="${base%.*}"
    out="$folder_y/$base.webp"
    [ -e "$out" ] && exit 0
    magick "$file" -resize 2048x2048 -define webp:lossless=true \
      -strip -filter Lanczos -define webp:method=6 "$out"
  '

echo "Done."
