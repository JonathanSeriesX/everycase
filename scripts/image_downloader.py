"""Download images for SKU variants while skipping ones tracked in source_images.txt."""

import multiprocessing
import os
import time
from multiprocessing import Pool, cpu_count
from pathlib import Path
from typing import Iterable, List, Set

import requests

BASE_URL_PNG = "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is/{code}?wid=4608&hei=4608&fmt=png"
BASE_URL_JPG = "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/{code}?wid=1024&hei=1024&fmt=jpg&qlt=95"
DEFAULT_FOLDER = "Source_images"
SCRIPT_DIR = Path(__file__).resolve().parent
IMAGES_TO_DOWNLOAD_PATH = SCRIPT_DIR / "images_to_download.txt"
SOURCE_IMAGES_PATH = SCRIPT_DIR / "source_images.txt"
SUFFIXES = [
    "AV01",
    "AV02",
    "AV03",
    "AV04",
    "AV05",
    "AV06",
    "AV07",
    "AV08",
    "AV09",
    "AV10",
    "AV1",
    "AV2",
    "AV3",
    "AV4",
    "AV5",
    "AV6",
    "AV7",
    "AV8",
    "AV9",
]


def load_existing_codes(path: Path) -> Set[str]:
    if not path.exists():
        return set()
    with path.open("r", encoding="utf-8") as file:
        return {line.strip() for line in file if line.strip()}


def append_codes(path: Path, codes: Iterable[str]) -> None:
    codes = list(codes)
    if not codes:
        return
    with path.open("a", encoding="utf-8") as file:
        for code in codes:
            file.write(f"{code}\n")


def expand_model_codes(model: str) -> List[str]:
    base = model.strip()
    if not base:
        return []
    variants = [base]
    variants.extend(f"{base}_{suffix}" for suffix in SUFFIXES)
    return variants


def download_image(code, folder, img_type, failed_list, success_list):
    file_save_path = os.path.join(folder, f"{code}.{img_type}")

    if os.path.exists(file_save_path):
        print(f"File {code}.{img_type} already exists in {folder}. Skipping download.")
        success_list.append(code)
        return True

    url = BASE_URL_PNG if img_type == "png" else BASE_URL_JPG
    url = url.format(code=code)

    try:
        response = requests.get(url, stream=True, timeout=15)
    except requests.exceptions.ConnectionError:
        raise
    except requests.exceptions.RequestException as exc:
        print(f"Request error while downloading {code}.{img_type}: {exc}")
        failed_list.append(code)
        return False

    if response.status_code >= 400 or "Asset Not Found" in response.text:
        response.close()
        print(f"Image {code}.{img_type} not found!")
        failed_list.append(code)
        return False

    os.makedirs(folder, exist_ok=True)
    with open(file_save_path, "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
    response.close()

    print(f"Downloaded {code}.{img_type} to {folder}")
    success_list.append(code)
    return True


def download_worker(task):
    code, folder, img_type, failed_downloads, successful_downloads = task
    try:
        download_image(code, folder, img_type, failed_downloads, successful_downloads)
    except requests.exceptions.ConnectionError as err:
        print(f"Connection error while downloading {code}.{img_type}: {err}")
        time.sleep(5)
        download_worker(task)


def build_tasks(input_path: Path, existing_codes: Set[str], failed_downloads, successful_downloads):
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    tasks = []
    current_folder = None

    with input_path.open("r", encoding="utf-8") as file:
        for raw_line in file:
            line = raw_line.strip()
            if not line:
                continue
            if line.endswith(":"):
                current_folder = line.rstrip(":").strip()
                continue

            for code in expand_model_codes(line):
                if code in existing_codes:
                    continue
                folder = current_folder or DEFAULT_FOLDER
                tasks.append((code, folder, "png", failed_downloads, successful_downloads))

    return tasks


if __name__ == "__main__":
    existing_codes = load_existing_codes(SOURCE_IMAGES_PATH)

    manager = multiprocessing.Manager()
    failed_downloads = manager.list()
    successful_downloads = manager.list()

    tasks = build_tasks(IMAGES_TO_DOWNLOAD_PATH, existing_codes, failed_downloads, successful_downloads)

    if not tasks:
        print("No new images to download.")
    else:
        with Pool(cpu_count()) as pool:
            pool.map(download_worker, tasks)

    seen: Set[str] = set()
    ordered_new_codes: List[str] = []
    for code in successful_downloads:
        if code not in existing_codes and code not in seen:
            seen.add(code)
            ordered_new_codes.append(code)

    append_codes(SOURCE_IMAGES_PATH, ordered_new_codes)

    if failed_downloads:
        print("\nFailed downloads:")
        for code in failed_downloads:
            print(f" - {code}")
