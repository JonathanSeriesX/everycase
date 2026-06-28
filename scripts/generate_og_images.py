#!/usr/bin/env python3
"""Pre-generate OG images for the iPhone MDX landing pages.

This is a batch equivalent of ``scripts/og-image.js``. It keeps the same
canvas, rotations, positions, centre crop, and unique-colour selection, but
uses local base SKU masters and reads models from each page's CaseTableTabs.
"""

from __future__ import annotations

import csv
import hashlib
import random
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATABASE_PATH = SCRIPT_DIR / "database.csv"
CONTENT_DIR = REPO_ROOT / "content" / "iphone"
OUTPUT_DIR = SCRIPT_DIR / "test"
SOURCE_DIR = Path("/Volumes/Storage/Images/1_final-sources")

MODEL_PATTERN = re.compile(r'\bmodel:\s*["\']([^"\']+)["\']')
OUTPUT_SIZE = (1200, 630)
CANVAS_SIZE = (2000, 2000)
CASE_SIZE = (800, 800)
CANVAS_COLOUR = (255, 255, 240)

# Sharp rotates clockwise. Pillow rotates counter-clockwise, hence the
# inverted signs here for the four angles used by og-image.js.
ROTATIONS = (210, 120, 300, 30)
POSITIONS = ((360, 130), (1000, 170), (80, 700), (720, 740))
EXCLUDED_KINDS = ("leather folio", "leather sleeve")


def read_database() -> list[dict[str, str]]:
    with DATABASE_PATH.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def page_models(page_path: Path) -> list[str]:
    text = page_path.read_text(encoding="utf-8")
    return list(dict.fromkeys(MODEL_PATTERN.findall(text)))


def base_asset(sku: str) -> Path:
    return SOURCE_DIR / f"{sku}.png"


def select_cases_and_assets(
    rows: list[dict[str, str]], models: list[str], page_slug: str
) -> list[tuple[dict[str, str], Path]]:
    eligible_models = set(models)
    candidates = [
        row
        for row in rows
        if row["model"] in eligible_models
        and not any(excluded in row["kind"].casefold() for excluded in EXCLUDED_KINDS)
        and base_asset(row["SKU"]).is_file()
    ]
    seed = int.from_bytes(hashlib.sha256(page_slug.encode()).digest()[:8], "big")
    random.Random(seed).shuffle(candidates)

    if len({row["SKU"] for row in candidates}) < 4:
        raise ValueError(
            f"{page_slug}: needs four local case masters, found {len(candidates)}"
        )

    selected: list[tuple[dict[str, str], Path]] = []
    selected_skus: set[str] = set()
    used_colours: set[str] = set()
    model_counts = {model: 0 for model in models}

    for _ in range(4):
        remaining = [row for row in candidates if row["SKU"] not in selected_skus]

        # The initial shuffle makes ties deterministic per page. The stable
        # sort then favours underrepresented models and new colours.
        remaining.sort(
            key=lambda row: (
                model_counts[row["model"]],
                row["colour"] in used_colours,
            )
        )
        row = remaining[0]

        selected.append((row, base_asset(row["SKU"])))
        selected_skus.add(row["SKU"])
        used_colours.add(row["colour"])
        model_counts[row["model"]] += 1

    return selected


def load_case(path: Path) -> Image.Image:
    with Image.open(path) as source:
        return ImageOps.fit(
            source.convert("RGBA"), CASE_SIZE, method=Image.Resampling.LANCZOS
        )


def render(cases: list[tuple[dict[str, str], Path]], output_path: Path) -> None:
    canvas = Image.new("RGB", CANVAS_SIZE, CANVAS_COLOUR)

    for (_, asset), angle, position in zip(cases, ROTATIONS, POSITIONS, strict=True):
        image = load_case(asset)
        rotated = image.rotate(
            angle,
            resample=Image.Resampling.BICUBIC,
            expand=True,
            fillcolor=(0, 0, 0, 0),
        )
        canvas.paste(rotated, position, rotated)

    crop_left = (CANVAS_SIZE[0] - OUTPUT_SIZE[0]) // 2
    crop_top = (CANVAS_SIZE[1] - OUTPUT_SIZE[1]) // 2
    cropped = canvas.crop(
        (
            crop_left,
            crop_top,
            crop_left + OUTPUT_SIZE[0],
            crop_top + OUTPUT_SIZE[1],
        )
    )
    cropped.save(output_path, format="PNG", optimize=True)


def main() -> int:
    if not SOURCE_DIR.is_dir():
        print(f"Local source directory not found: {SOURCE_DIR}", file=sys.stderr)
        return 1

    rows = read_database()
    pages = sorted(CONTENT_DIR.glob("*.mdx"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    failures: list[str] = []
    for page in pages:
        try:
            models = page_models(page)
            cases = select_cases_and_assets(rows, models, page.stem)
            output_path = OUTPUT_DIR / f"{page.stem}.png"
            render(cases, output_path)
            selection = ", ".join(
                f'{asset.stem} ({case["model"]}, {case["colour"]})'
                for case, asset in cases
            )
            print(f"{output_path.name}: {selection}")
        except Exception as error:
            failures.append(f"{page.stem}: {error}")

    if failures:
        print("\nFailed pages:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print(f"\nGenerated {len(pages)} images in {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
