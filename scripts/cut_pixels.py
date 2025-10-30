"""Cuts very certain amount of pixels from supplied images"""
import os
from PIL import Image
from multiprocessing import Pool, cpu_count


def crop_image(args):
    input_path, output_path, left, top, right, bottom = args

    with Image.open(input_path) as img:
        width, height = img.size

        left_crop = left
        right_crop = width - right
        top_crop = top
        bottom_crop = height - bottom

        cropped = img.crop((left_crop, top_crop, right_crop, bottom_crop))
        cropped.save(output_path)


def multi_process_crop_images(
    input_folder, output_folder, top=0, bottom=0, left=0, right=0
):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Generate a list of arguments to be passed to each process
    arguments = []
    for filename in os.listdir(input_folder):
        if filename.endswith(
            (".png", ".jpg", ".jpeg", ".bmp", ".tiff")
        ):  # you can add more file types if needed
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, filename)

            arguments.append((input_path, output_path, left, top, right, bottom))

    # Utilize all available CPU cores
    with Pool(cpu_count()) as pool:
        pool.map(crop_image, arguments)


if __name__ == "__main__":
    source_folder = "trash/images"
    destination_folder = "trash/test"

    # Example: Crop 200 pixels from the top and 100 pixels from the bottom
    multi_process_crop_images(
        source_folder, destination_folder, top=0, bottom=2000, left=1000, right=1000
    )
