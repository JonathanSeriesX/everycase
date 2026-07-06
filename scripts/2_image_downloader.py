"""Download Apple images using explicit per-line resolutions.

Missing Apple CDN variants are expected: HTTP 404 responses are skipped safely.
Successful assets are appended to database/images.csv (filename + square res)
for gallery discovery; the remaining metadata columns are filled in later.
"""

import argparse
import csv
import multiprocessing
import os
import time
from dataclasses import dataclass
from multiprocessing import Pool
from pathlib import Path
from typing import Iterable, List, Set, Tuple

import requests

BASE_URL_TEMPLATE = "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is/{code}?wid={wid}&hei={hei}&fmt=png-alpha"
SCRIPT_DIR = Path(__file__).resolve().parent
IMAGES_TO_DOWNLOAD_PATH = SCRIPT_DIR / "1_download_list.txt"
IMAGES_CSV_PATH = SCRIPT_DIR.parent / "database" / "images.csv"
DEFAULT_TARGET_FOLDER = Path("/Volumes/Storage/Images/download")

# Column order of database/images.csv. The downloader only knows the filename
# and the square resolution it requested; hidden/colour/non_transparent are
# populated later by hand.
IMAGES_CSV_HEADER = ["filename", "res", "hidden", "colour", "non_transparent"]


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
            if line.endswith(":"):
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


def load_existing_codes(path: Path) -> Set[str]:
    if not path.exists():
        return set()
    with path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        return {
            (row.get("filename") or "").strip()
            for row in reader
            if (row.get("filename") or "").strip()
        }


def append_image_rows(path: Path, rows: Iterable[Tuple[str, int]]) -> None:
    """Append (filename, res) rows to images.csv, writing the header if new.

    Uses LF line endings (lineterminator) to match the file's existing style;
    csv-parse reads either, but mixing endings in one file breaks the build.
    """
    rows = list(rows)
    if not rows:
        return
    write_header = not path.exists() or path.stat().st_size == 0
    with path.open("a", encoding="utf-8", newline="") as file:
        writer = csv.writer(file, lineterminator="\n")
        if write_header:
            writer.writerow(IMAGES_CSV_HEADER)
        blanks = [""] * (len(IMAGES_CSV_HEADER) - 2)
        for code, res in rows:
            writer.writerow([code, res, *blanks])


def download_image(task: DownloadTask, failed_list, success_list, resolved_list) -> bool:
    """Download one image.

    A code is "resolved" — safe to remove from list.txt — only on a definitive
    outcome: the file already exists, the download succeeds, or the CDN returns
    404 (the image will never exist). Transient/unknown errors (connection
    drops, retries exceeded, other HTTP codes, bad content type) are NOT
    resolved, so their lines stay in list.txt for a future retry.
    """
    os.makedirs(task.folder, exist_ok=True)
    file_save_path = task.folder / f"{task.code}.png"
    url = BASE_URL_TEMPLATE.format(code=task.code, wid=task.width, hei=task.height)

    if file_save_path.is_file() and file_save_path.stat().st_size > 0:
        print(f"Skipping existing image {file_save_path}")
        success_list.append(task.code)
        resolved_list.append(task.code)
        return True

    try:
        response = requests.get(url, stream=True, timeout=15)
    except requests.exceptions.ConnectionError:
        raise
    except requests.exceptions.RequestException as exc:
        print(f"Request error while downloading {task.code}.png: {exc}")
        failed_list.append(task.code)
        return False

    if response.status_code == 404:
        response.close()
        print(f"Skipping unavailable image {task.code}.png (HTTP 404)")
        failed_list.append(task.code)
        resolved_list.append(task.code)
        return False

    if response.status_code >= 400:
        status_code = response.status_code
        response.close()
        print(f"Skipping {task.code}.png (HTTP {status_code})")
        failed_list.append(task.code)
        return False

    content_type = response.headers.get("content-type", "").lower()
    if not content_type.startswith("image/"):
        response.close()
        print(f"Skipping {task.code}.png (unexpected content type: {content_type})")
        failed_list.append(task.code)
        return False

    with open(file_save_path, "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
    response.close()

    print(f"Downloaded {task.code}.png ({task.width}x{task.height}) to {task.folder}")
    success_list.append(task.code)
    resolved_list.append(task.code)
    return True


def download_worker(task):
    download_task, failed_downloads, successful_downloads, resolved_downloads = task
    try:
        download_image(
            download_task, failed_downloads, successful_downloads, resolved_downloads
        )
    except requests.exceptions.ConnectionError as err:
        print(f"Connection error while downloading {download_task.code}.png: {err}")
        time.sleep(5)
        download_worker(task)


def remove_resolved_lines(path: Path, resolved_codes: Set[str]) -> int:
    """Drop resolved task lines from list.txt, preserving everything else.

    Comments, blank lines, and headers (e.g. 'folder:') are kept verbatim.
    Returns the number of lines removed.
    """
    if not resolved_codes or not path.exists():
        return 0

    kept: List[str] = []
    removed = 0
    with path.open("r", encoding="utf-8") as file:
        for raw_line in file:
            stripped = raw_line.strip()
            is_task = (
                stripped
                and not stripped.startswith("#")
                and not stripped.endswith(":")
                and "," in stripped
            )
            if is_task and stripped.split(",", 1)[0].strip() in resolved_codes:
                removed += 1
                continue
            kept.append(raw_line)

    if removed:
        tmp_path = path.with_suffix(path.suffix + ".tmp")
        with tmp_path.open("w", encoding="utf-8") as file:
            file.writelines(kept)
        os.replace(tmp_path, path)
    return removed


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
    existing_codes = load_existing_codes(IMAGES_CSV_PATH)

    manager = multiprocessing.Manager()
    failed_downloads = manager.list()
    successful_downloads = manager.list()
    resolved_downloads = manager.list()

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
    worker_payloads = [
        (task, failed_downloads, successful_downloads, resolved_downloads)
        for task in tasks
    ]

    if not worker_payloads:
        print("No images to process.")
    else:
        with Pool(args.processes) as pool:
            pool.map(download_worker, worker_payloads)

    successful_set = set(successful_downloads)
    ordered_new_rows: List[Tuple[str, int]] = []
    seen = set()
    for task in tasks:
        code = task.code
        if code in successful_set and code not in existing_codes and code not in seen:
            seen.add(code)
            ordered_new_rows.append((code, task.width))
    append_image_rows(IMAGES_CSV_PATH, ordered_new_rows)

    removed = remove_resolved_lines(input_file, set(resolved_downloads))
    if removed:
        print(f"\nRemoved {removed} resolved line(s) from {input_file.name}.")

    if failed_downloads:
        print("\nFailed downloads:")
        for code in failed_downloads:
            print(f" - {code}")
