folder_y="/Volumes/Storage/Images/2_compressed-sources"
folder_z="/Volumes/Storage/Images/3_compressed-avif-previews"
folder_a="/Volumes/Storage/Images/3_compressed-webp-previews"

rclone copy "$folder_y" R2:everycase-images/everyimage --progress --exclude '.DS_Store'
rclone copy "$folder_z" R2:everycase-images/everypreview --progress --exclude '.DS_Store'
rclone copy "$folder_a" R2:everycase-images/everypreview --progress --exclude '.DS_Store'