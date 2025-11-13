folder_x="1_sources"
folder_y="2_compressed_sources"
folder_z="3_compressed_previews"

mkdir -p "$folder_y" "$folder_z"

# Previews (512px avif, q=90)
for f in "$folder_x"/*.png; do
  [ -f "$f" ] || continue
  base="$(basename "${f%.*}")"
  out_avif="$folder_z/$base.avif"
  if [ ! -e "$out_avif" ]; then
    magick "$f" -resize 512x512 -quality 90 -strip -filter Lanczos \
      -define avif:codec=aom -define avif:speed=0 "$out_avif"
  fi
done

# Sources (2048px webp, lossless)
for f in "$folder_x"/*.png; do
  [ -f "$f" ] || continue
  base="$(basename "${f%.*}")"
  out="$folder_y/$base.webp"
  if [ ! -e "$out" ]; then
    magick "$f" -resize 2048x2048 -define webp:lossless=true \
      -strip -filter Lanczos -define webp:method=6 "$out"
  fi
done
