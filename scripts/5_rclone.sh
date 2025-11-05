folder_y="3_compressed_sources"
folder_z="4_compressed_previews"

rclone copy "$folder_y" R2:everycase-images/everyimage --progress --exclude '.DS_Store'
rclone copy "$folder_z" R2:everycase-images/everypreview --progress --exclude '.DS_Store'
