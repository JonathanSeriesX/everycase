#!/usr/bin/env bash
set -euo pipefail

# Paths/remote default to the canonical layout but can be overridden by the
# environment (assets.py sets these from its single CONFIG block).
folder_y="${AVIF_SOURCES:-/Volumes/Storage/Images/2_compressed-avif-sources}"
folder_z="${AVIF_PREVIEWS:-/Volumes/Storage/Images/3_compressed-avif-previews}"
remote="${R2_REMOTE:-R2:everycase-images}"

rclone copy "$folder_y" "$remote/everyimage" --progress --exclude '.DS_Store'
rclone copy "$folder_z" "$remote/everypreview" --progress --exclude '.DS_Store'
