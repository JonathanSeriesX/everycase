"""Downloads images from Apple servers for SKUs mentioned in models.txt files"""

import os
import time
import multiprocessing
from multiprocessing import Pool, cpu_count
import requests

BASE_URL_PNG = "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is/{code}?wid=4608&hei=4608&fmt=png"
BASE_URL_JPG = "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/{code}?wid=1024&hei=1024&fmt=jpg&qlt=95"


def download_image(code, folder, img_type, failed_list):
    file_save_path = os.path.join(folder, f"{code}.{img_type}")

    if os.path.exists(file_save_path):
        print(f"File {code}.{img_type} already exists in {folder}. Skipping download.")
        return

    url = BASE_URL_PNG if img_type == "png" else BASE_URL_JPG
    url = url.format(code=code)

    response = requests.get(url, stream=True)

    if "Asset Not Found" in response.text:
        print(f"Image {code}.{img_type} not found!")
        failed_list.append(code)
        return False

    os.makedirs(folder, exist_ok=True)
    with open(file_save_path, "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)

    print(f"Downloaded {code}.{img_type} to {folder}")
    return True


def download_worker(task):
    code, folder, img_type, failed_downloads = task
    try:
        download_image(code, folder, img_type, failed_downloads)
    except requests.exceptions.ConnectionError as e:
        print(f"Connection error while downloading {code}.{img_type}: {e}")
        time.sleep(5)
        download_worker(task)


def process_input_file(input_path, failed_downloads):
    with open(input_path, "r") as f:
        lines = f.read().splitlines()

    folder_name = None
    models = []
    tasks = []

    for line in lines:
        if line.endswith(":"):
            if folder_name:
                for model in models:
                    tasks.append((model, folder_name, "png", failed_downloads))
                models = []
            folder_name = line[:-1]
        else:
            models.append(line)

    if folder_name:
        for model in models:
            tasks.append((model, folder_name, "png", failed_downloads))
    else:
        for model in models:
            tasks.append((model, "Source_images", "png", failed_downloads))

    with Pool(cpu_count()) as p:
        p.map(download_worker, tasks)


def remove_failed_models(file_path, failed_list):
    with open(file_path, "r") as f:
        lines = f.readlines()
    with open(file_path, "w") as f:
        for line in lines:
            if line.strip() not in failed_list:
                f.write(line)


if __name__ == "__main__":
    manager = multiprocessing.Manager()
    failed_downloads = manager.list()
    process_input_file("images_to_download.txt", failed_downloads)
    remove_failed_models("images_to_download.txt", list(failed_downloads))
