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

INPUT_DIR = Path("imgs")  # : set to your source folder
OUTPUT_DIR = Path("pdfs")  # : set to your destination folder
RECURSIVE = False  # Set True to crawl subfolders
NUM_WORKERS = 4  # Increase for faster throughput

# GrabCut tuning
GC_ITERATIONS = 5  # More iterations → tighter matte, slower runtime
BORDER_PX = 6  # Pixels at borders forced to background
SURE_BG_VALUE = 250  # HSV V threshold for certain white background
SOFT_BG_VALUE = 235  # HSV V threshold to catch soft shadows
S_MAX_BG = 25  # HSV S maximum for white background/shadows
CORE_SHRINK = 5  # Distance (px) kept as certain foreground core
ALPHA_BLUR = 0.7  # Gaussian sigma applied to alpha for smooth edges


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def gather_images(root: Path, recursive: bool) -> Iterable[Path]:
    pattern = "**/*.png" if recursive else "*.png"
    return sorted(p for p in root.glob(pattern) if p.is_file())


def build_grabcut_mask(img_bgr: np.ndarray) -> np.ndarray:
    """Derive an initial mask for GrabCut with aggressive background seeding."""
    h, w = img_bgr.shape[:2]
    hsv = cv.cvtColor(img_bgr, cv.COLOR_BGR2HSV)
    v = hsv[:, :, 2]
    s = hsv[:, :, 1]

    mask = np.full((h, w), cv.GC_PR_BGD, dtype=np.uint8)

    # White background (pure white) → certain background
    sure_bg = (v >= SURE_BG_VALUE) & (s <= 10)
    mask[sure_bg] = cv.GC_BGD

    # Soft whites (shadows) → probable background
    soft_bg = (v >= SOFT_BG_VALUE) & (s <= S_MAX_BG)
    mask[soft_bg] = cv.GC_PR_BGD

    # Fortify the borders as certain background to avoid edge artifacts
    if BORDER_PX > 0:
        mask[:BORDER_PX, :] = cv.GC_BGD
        mask[-BORDER_PX:, :] = cv.GC_BGD
        mask[:, :BORDER_PX] = cv.GC_BGD
        mask[:, -BORDER_PX:] = cv.GC_BGD

    # Subject seed: anything not classified as soft background
    subject_seed = (~soft_bg).astype(np.uint8) * 255
    kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, (5, 5))
    subject_seed = cv.morphologyEx(subject_seed, cv.MORPH_OPEN, kernel, iterations=1)
    subject_seed = cv.morphologyEx(subject_seed, cv.MORPH_CLOSE, kernel, iterations=1)
    mask[subject_seed == 255] = cv.GC_PR_FGD

    # Sure foreground core derived from distance transform
    if subject_seed.any():
        dist = cv.distanceTransform(subject_seed, cv.DIST_L2, 5)
        core = dist > CORE_SHRINK
        mask[core] = cv.GC_FGD

    return mask


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

    # Clean tiny fringes and soften the transition
    cleanup_kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, (3, 3))
    alpha = cv.morphologyEx(alpha, cv.MORPH_OPEN, cleanup_kernel, iterations=1)
    if ALPHA_BLUR > 0:
        alpha = cv.GaussianBlur(alpha, (0, 0), ALPHA_BLUR)
    return alpha


def process_image(inp: Path, out_root: Path) -> bool:
    out_path = out_root / inp.relative_to(INPUT_DIR)
    out_path = out_path.with_name(out_path.stem + "-cutout.png")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    img_bgr = cv.imread(str(inp), cv.IMREAD_COLOR)
    if img_bgr is None:
        print(f"[skip] Unable to read {inp}")
        return False

    mask = build_grabcut_mask(img_bgr)
    alpha = run_grabcut(img_bgr, mask)

    # Force pure white pixels outside the subject to be transparent
    hsv = cv.cvtColor(img_bgr, cv.COLOR_BGR2HSV)
    v = hsv[:, :, 2]
    s = hsv[:, :, 1]
    residual_bg = ((v >= SURE_BG_VALUE - 2) & (s <= 12)) & (alpha < 220)
    alpha[residual_bg] = 0

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
