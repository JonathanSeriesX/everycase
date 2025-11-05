folder_x="2_clean"
folder_y="3_compressed_sources"
folder_z="4_compressed_previews"

mkdir -p "$folder_y" "$folder_z"

# Previews (512px, q=95)
for f in "$folder_x"/*.png; do
  [ -f "$f" ] || continue
  base="$(basename "${f%.*}")"
  out_avif="$folder_z/$base.avif"
  if [ ! -e "$out_avif" ]; then
    magick "$f" -resize 512x512 -quality 95 -strip -filter Lanczos \
      -define avif:codec=aom -define avif:speed=0 "$out_avif"
  fi

  out_webp="$folder_z/$base.webp"
  if [ ! -e "$out_webp" ]; then
    magick "$f" -resize 512x512 -quality 95 -strip -filter Lanczos \
      -define webp:method=6 "$out_webp"
  fi
done

# Sources (1536px, lossless)
for f in "$folder_x"/*.png; do
  [ -f "$f" ] || continue
  base="$(basename "${f%.*}")"
  out="$folder_y/$base.avif"
  if [ ! -e "$out" ]; then
    magick "$f" -resize 1536x1536 -quality 100 -define avif:lossless=true \
      -strip -filter Lanczos -define avif:codec=aom -define avif:speed=0 "$out"
  fi
done

rclone copy "$folder_y" R2:everycase-images/everyimage --progress --exclude '.DS_Store'
rclone copy "$folder_z" R2:everycase-images/everypreview --progress --exclude '.DS_Store'
