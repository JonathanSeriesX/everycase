"""Download Apple images using explicit per-line resolutions."""

import argparse
import multiprocessing
import os
import time
from dataclasses import dataclass
from multiprocessing import Pool
from pathlib import Path
from typing import List, Tuple

import requests

BASE_URL_TEMPLATE = "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is/{code}?wid={wid}&hei={hei}&fmt=png-alpha"
SCRIPT_DIR = Path(__file__).resolve().parent
IMAGES_TO_DOWNLOAD_PATH = SCRIPT_DIR / "list.txt"
DEFAULT_TARGET_FOLDER = SCRIPT_DIR / "lower-res-redownload"


@dataclass(frozen=True)
class DownloadTask:
    code: str
    width: int
    height: int
    folder: Path


def parse_resolution(resolution: str) -> Tuple[int, int]:
    cleaned = resolution.lower().replace(" ", "")
    if "x" not in cleaned:
        raise ValueError(
            f"Invalid resolution '{resolution}'. Expected format WIDTHxHEIGHT."
        )
    width_str, height_str = cleaned.split("x", 1)
    if not width_str.isdigit() or not height_str.isdigit():
        raise ValueError(
            f"Invalid resolution '{resolution}'. Width and height must be integers."
        )
    return int(width_str), int(height_str)


def parse_tasks(file_path: Path, target_folder: Path) -> List[DownloadTask]:
    if not file_path.exists():
        raise FileNotFoundError(f"Input file not found: {file_path}")

    tasks: List[DownloadTask] = []
    with file_path.open("r", encoding="utf-8") as file:
        for raw_line in file:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if "," not in line:
                print(f"Skipping line without comma: '{line}'")
                continue
            code_part, res_part = line.split(",", 1)
            code = code_part.strip()
            res_value = res_part.strip()
            if not code or not res_value:
                print(f"Skipping malformed line: '{line}'")
                continue
            try:
                width, height = parse_resolution(res_value)
            except ValueError as exc:
                print(exc)
                continue
            tasks.append(
                DownloadTask(
                    code=code, width=width, height=height, folder=target_folder
                )
            )

    if not tasks:
        print("No valid download entries found in the input file.")
    return tasks


def download_image(task: DownloadTask, failed_list, success_list) -> bool:
    os.makedirs(task.folder, exist_ok=True)
    file_save_path = task.folder / f"{task.code}.png"
    url = BASE_URL_TEMPLATE.format(code=task.code, wid=task.width, hei=task.height)

    try:
        response = requests.get(url, stream=True, timeout=15)
    except requests.exceptions.ConnectionError:
        raise
    except requests.exceptions.RequestException as exc:
        print(f"Request error while downloading {task.code}.png: {exc}")
        failed_list.append(task.code)
        return False

    if response.status_code >= 400 or "Asset Not Found" in response.text:
        response.close()
        print(f"Image {task.code}.png not found!")
        failed_list.append(task.code)
        return False

    with open(file_save_path, "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
    response.close()

    print(f"Downloaded {task.code}.png ({task.width}x{task.height}) to {task.folder}")
    success_list.append(task.code)
    return True


def download_worker(task):
    download_task, failed_downloads, successful_downloads = task
    try:
        download_image(download_task, failed_downloads, successful_downloads)
    except requests.exceptions.ConnectionError as err:
        print(f"Connection error while downloading {download_task.code}.png: {err}")
        time.sleep(5)
        download_worker(task)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input-file",
        type=Path,
        default=IMAGES_TO_DOWNLOAD_PATH,
        help="Text file containing 'SKU,resolution' entries (e.g., MC670_AV3,1280x1280).",
    )
    parser.add_argument(
        "--target-folder",
        type=Path,
        default=DEFAULT_TARGET_FOLDER,
        help="Folder where downloaded PNGs will be stored.",
    )
    parser.add_argument(
        "--processes",
        type=int,
        default=multiprocessing.cpu_count(),
        help="Number of worker processes to use.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    manager = multiprocessing.Manager()
    failed_downloads = manager.list()
    successful_downloads = manager.list()

    input_file = (
        args.input_file
        if args.input_file.is_absolute()
        else (SCRIPT_DIR / args.input_file).resolve()
    )
    target_folder = (
        args.target_folder
        if args.target_folder.is_absolute()
        else (SCRIPT_DIR / args.target_folder).resolve()
    )

    tasks = parse_tasks(input_file, target_folder)
    worker_payloads = [(task, failed_downloads, successful_downloads) for task in tasks]

    if not worker_payloads:
        print("No images to process.")
    else:
        with Pool(args.processes) as pool:
            pool.map(download_worker, worker_payloads)

    if failed_downloads:
        print("\nFailed downloads:")
        for code in failed_downloads:
            print(f" - {code}")
