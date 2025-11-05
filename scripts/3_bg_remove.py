#!/usr/bin/env python3
"""
Automated background removal for white-backdrop product shots using OpenCV GrabCut.

Adjust `INPUT_DIR` and `OUTPUT_DIR` below before running. Every PNG in the input
directory (optionally its subfolders) will be processed and written with an alpha
channel that removes the pure white background as well as faint shadows beneath
the subject. RGB pixels remain untouched.

Requires: opencv-python, numpy
"""

from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Iterable

import cv2 as cv
import numpy as np

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

INPUT_DIR = Path("1_sources")  # : set to your source folder
OUTPUT_DIR = Path("2_clean")  # : set to your destination folder
RECURSIVE = False  # Set True to crawl subfolders
NUM_WORKERS = 8  # Increase for faster throughput

# GrabCut tuning
GC_ITERATIONS = 7  # More iterations → tighter matte, slower runtime
BORDER_PX = 1  # Pixels at borders forced to background
WHITE_TOLERANCE = 10  # Allowed diff from pure white during flood fill
SHADOW_EXPAND = 4  # Dilate background mask to catch soft shadows
CORE_ERODE = 2  # Erode probable-foreground to derive certain foreground
ALPHA_BLUR = 0.6  # Gaussian sigma applied to alpha for smooth edges

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def gather_images(root: Path, recursive: bool) -> Iterable[Path]:
    pattern = "**/*.png" if recursive else "*.png"
    return sorted(p for p in root.glob(pattern) if p.is_file())


def build_grabcut_mask(img_bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Seed GrabCut using flood-fill from borders to isolate the white backdrop."""
    h, w = img_bgr.shape[:2]
    mask = np.full((h, w), cv.GC_PR_FGD, dtype=np.uint8)

    gray = cv.cvtColor(img_bgr, cv.COLOR_BGR2GRAY)
    flood_flags = 4 | cv.FLOODFILL_MASK_ONLY | cv.FLOODFILL_FIXED_RANGE | (255 << 8)

    background_mask = np.zeros((h, w), dtype=np.uint8)
    for seed in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        ff_mask = np.zeros((h + 2, w + 2), np.uint8)
        cv.floodFill(
            gray.copy(),
            ff_mask,
            seed,
            0,
            WHITE_TOLERANCE,
            WHITE_TOLERANCE,
            flood_flags,
        )
        background_mask |= ff_mask[1:-1, 1:-1]

    # Force breadcrumb of background along the image border
    if BORDER_PX > 0:
        background_mask[:BORDER_PX, :] = 255
        background_mask[-BORDER_PX:, :] = 255
        background_mask[:, :BORDER_PX] = 255
        background_mask[:, -BORDER_PX:] = 255

    mask[background_mask == 255] = cv.GC_BGD

    if SHADOW_EXPAND > 0:
        kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, (3, 3))
        dilated = cv.dilate(background_mask, kernel, iterations=SHADOW_EXPAND)
        mask[(dilated == 255) & (mask != cv.GC_BGD)] = cv.GC_PR_BGD
    else:
        dilated = background_mask

    # Probable foreground = anything not claimed by expanded background.
    probable_fg = (dilated == 0).astype(np.uint8) * 255
    mask[probable_fg == 255] = cv.GC_PR_FGD

    if CORE_ERODE > 0:
        core_kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, (3, 3))
        core = cv.erode(
            probable_fg,
            core_kernel,
            iterations=max(1, CORE_ERODE // 2),
        )
        mask[core == 255] = cv.GC_FGD

    return mask, background_mask


def run_grabcut(img_bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    cv.grabCut(
        img_bgr, mask, None, bgd_model, fgd_model, GC_ITERATIONS, cv.GC_INIT_WITH_MASK
    )

    alpha = np.where(
        (mask == cv.GC_FGD) | (mask == cv.GC_PR_FGD),
        255,
        0,
    ).astype(np.uint8)

    # Light blur on alpha for anti-aliased edges
    if ALPHA_BLUR > 0:
        alpha = cv.GaussianBlur(alpha, (0, 0), ALPHA_BLUR)
    return alpha


def process_image(inp: Path, out_root: Path) -> bool:
    out_path = out_root / inp.relative_to(INPUT_DIR)
    out_path = out_path.with_name(out_path.stem + ".png")

    """
    if out_path.exists():
        print(
            f"[skip] {inp.name} → {out_path.relative_to(out_root)} (already processed)"
        )
        return True
    """

    out_path.parent.mkdir(parents=True, exist_ok=True)

    img_bgr = cv.imread(str(inp), cv.IMREAD_COLOR)
    if img_bgr is None:
        print(f"[skip] Unable to read {inp}")
        return False

    mask, base_bg = build_grabcut_mask(img_bgr)
    alpha = run_grabcut(img_bgr, mask)

    # Ensure anything connected to original background remains transparent
    core_kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, (3, 3))
    expanded_bg = cv.dilate(base_bg, core_kernel, iterations=max(1, SHADOW_EXPAND))
    alpha[expanded_bg == 255] = 0

    rgba = cv.cvtColor(img_bgr, cv.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha

    if not cv.imwrite(str(out_path), rgba):
        print(f"[fail] Could not write {out_path}")
        return False

    print(f"[ok] {inp.name} → {out_path.relative_to(out_root)}")
    return True


def main() -> None:
    if not INPUT_DIR.is_dir():
        raise SystemExit(f"Input directory does not exist: {INPUT_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    images = list(gather_images(INPUT_DIR, RECURSIVE))
    if not images:
        raise SystemExit("No PNG files found to process.")

    if NUM_WORKERS <= 1:
        for path in images:
            process_image(path, OUTPUT_DIR)
    else:
        with ThreadPoolExecutor(max_workers=NUM_WORKERS) as pool:
            list(pool.map(lambda p: process_image(p, OUTPUT_DIR), images))

    print("Done.")


if __name__ == "__main__":
    main()
