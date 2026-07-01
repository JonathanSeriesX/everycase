#!/usr/bin/env python3
"""Generate two-product OG image choices for every iPad landing page."""

from __future__ import annotations

import argparse
import csv
import hashlib
import random
import re
import sys
from collections import OrderedDict
from pathlib import Path

from PIL import Image, ImageChops


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATABASE_PATH = SCRIPT_DIR / "database.csv"
CONTENT_DIR = REPO_ROOT / "content" / "ipad"
SOURCE_DIR = Path("/Volumes/Storage/Images/1_final-sources")
DEFAULT_OUTPUT_DIR = Path("/Volumes/Storage/Images/og")

MODEL_PATTERN = re.compile(r'\bmodel:\s*["\']([^"\']+)["\']')
ALLOWED_KIND_PARTS = ("smart cover", "smart case", "smart folio")
OUTPUT_SIZE = (2400, 1260)
PRODUCT_CANVAS_SIZE = (3000, 3000)
PRODUCT_MAX_SIZE = (2500, 2600)
BACKGROUND_COLOUR = (241, 241, 241, 255)
ROTATIONS = (210, 30)
CENTRES = ((350, 630), (2050, 630))
DEFAULT_VARIANTS = 10
PRODUCTS_PER_IMAGE = 2
COLLISION_NUDGE = 12
MAX_COLLISION_PASSES = 100
RESIZED_CACHE_LIMIT = 20


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--variants", type=int, default=DEFAULT_VARIANTS)
    parser.add_argument("--page", action="append", default=[])
    return parser.parse_args()


def read_database() -> list[dict[str, str]]:
    with DATABASE_PATH.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def page_models(page_path: Path) -> list[str]:
    return list(dict.fromkeys(MODEL_PATTERN.findall(page_path.read_text())))


def base_asset(sku: str) -> Path:
    return SOURCE_DIR / f"{sku}.png"


def kind_is_supported(kind: str) -> bool:
    normalized = kind.casefold()
    return "keyboard" not in normalized and any(
        allowed in normalized for allowed in ALLOWED_KIND_PARTS
    )


def eligible_products(
    rows: list[dict[str, str]], models: list[str], page_slug: str
) -> list[tuple[dict[str, str], Path]]:
    eligible_models = set(models)
    candidates = [
        (row, base_asset(row["SKU"]))
        for row in rows
        if row["model"] in eligible_models
        and kind_is_supported(row["kind"])
        and base_asset(row["SKU"]).is_file()
    ]
    if len({row["SKU"] for row, _ in candidates}) < PRODUCTS_PER_IMAGE:
        raise ValueError(f"{page_slug}: fewer than two eligible local masters")
    return candidates


def variant_seed(page_slug: str, variant: int, retry: int = 0) -> int:
    value = f"ipad:{page_slug}:{variant}:{retry}".encode()
    return int.from_bytes(hashlib.sha256(value).digest()[:8], "big")


def choose_products(
    candidates: list[tuple[dict[str, str], Path]], rng: random.Random
) -> list[tuple[dict[str, str], Path]]:
    remaining = candidates.copy()
    rng.shuffle(remaining)
    first = remaining[0]
    first_row = first[0]
    choices = [item for item in remaining[1:] if item[0]["SKU"] != first_row["SKU"]]
    choices.sort(
        key=lambda item: (
            item[0]["model"] == first_row["model"],
            item[0]["colour"].casefold() == first_row["colour"].casefold(),
            item[0]["kind"] == first_row["kind"],
            rng.random(),
        )
    )
    selected = [first, choices[0]]
    rng.shuffle(selected)
    return selected


def plan_variants(
    candidates: list[tuple[dict[str, str], Path]], page_slug: str, count: int
) -> list[list[tuple[dict[str, str], Path]]]:
    planned: list[list[tuple[dict[str, str], Path]]] = []
    used_orders: set[tuple[str, str]] = set()
    for variant in range(1, count + 1):
        for retry in range(500):
            rng = random.Random(variant_seed(page_slug, variant, retry))
            selection = choose_products(candidates, rng)
            signature = tuple(row["SKU"] for row, _ in selection)
            if signature not in used_orders:
                used_orders.add(signature)
                planned.append(selection)
                break
        else:
            raise ValueError(f"{page_slug}: could not create {count} unique variants")
    return planned


class ProductCache:
    def __init__(self, limit: int = RESIZED_CACHE_LIMIT) -> None:
        self.limit = limit
        self.images: OrderedDict[Path, Image.Image] = OrderedDict()

    def get(self, path: Path) -> Image.Image:
        if path in self.images:
            image = self.images.pop(path)
            self.images[path] = image
            return image
        with Image.open(path) as source:
            image = normalize_product(source)
        self.images[path] = image
        if len(self.images) > self.limit:
            _, evicted = self.images.popitem(last=False)
            evicted.close()
        return image


def normalize_product(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    alpha_box = rgba.getbbox()
    if alpha_box is None:
        rgba.close()
        raise ValueError("source image is fully transparent")
    product = rgba.crop(alpha_box)
    rgba.close()
    scale = min(
        PRODUCT_MAX_SIZE[0] / product.width,
        PRODUCT_MAX_SIZE[1] / product.height,
    )
    size = (round(product.width * scale), round(product.height * scale))
    resized = product.resize(size, Image.Resampling.LANCZOS)
    product.close()
    normalized = Image.new("RGBA", PRODUCT_CANVAS_SIZE, (0, 0, 0, 0))
    position = (
        (PRODUCT_CANVAS_SIZE[0] - size[0]) // 2,
        (PRODUCT_CANVAS_SIZE[1] - size[1]) // 2,
    )
    normalized.alpha_composite(resized, position)
    resized.close()
    return normalized


def alpha_overlap(
    first: Image.Image,
    first_position: list[int],
    second: Image.Image,
    second_position: list[int],
) -> bool:
    first_alpha = first.getchannel("A")
    second_alpha = second.getchannel("A")
    first_box = first_alpha.getbbox()
    second_box = second_alpha.getbbox()
    if first_box is None or second_box is None:
        first_alpha.close()
        second_alpha.close()
        return False
    first_global = tuple(
        value + first_position[index % 2] for index, value in enumerate(first_box)
    )
    second_global = tuple(
        value + second_position[index % 2] for index, value in enumerate(second_box)
    )
    intersection = (
        max(first_global[0], second_global[0]),
        max(first_global[1], second_global[1]),
        min(first_global[2], second_global[2]),
        min(first_global[3], second_global[3]),
    )
    if intersection[0] >= intersection[2] or intersection[1] >= intersection[3]:
        first_alpha.close()
        second_alpha.close()
        return False
    first_crop = first_alpha.crop(
        tuple(
            intersection[index] - first_position[index % 2] for index in range(4)
        )
    )
    second_crop = second_alpha.crop(
        tuple(
            intersection[index] - second_position[index % 2] for index in range(4)
        )
    )
    overlap = ImageChops.multiply(first_crop, second_crop).getbbox() is not None
    first_crop.close()
    second_crop.close()
    first_alpha.close()
    second_alpha.close()
    return overlap


def place_layers(layers: list[Image.Image]) -> list[list[int]]:
    positions = [
        [round(cx - layer.width / 2), round(cy - layer.height / 2)]
        for layer, (cx, cy) in zip(layers, CENTRES, strict=True)
    ]
    for _ in range(MAX_COLLISION_PASSES):
        if not alpha_overlap(layers[0], positions[0], layers[1], positions[1]):
            return positions
        positions[0][0] -= COLLISION_NUDGE
        positions[1][0] += COLLISION_NUDGE
    raise ValueError("could not separate iPad product layers")


def render(
    products: list[tuple[dict[str, str], Path]],
    background_path: Path,
    transparent_path: Path,
    cache: ProductCache,
) -> None:
    layers = [
        cache.get(asset).rotate(
            angle,
            resample=Image.Resampling.BICUBIC,
            expand=True,
            fillcolor=(0, 0, 0, 0),
        )
        for (_, asset), angle in zip(products, ROTATIONS, strict=True)
    ]
    positions = place_layers(layers)
    transparent = Image.new("RGBA", OUTPUT_SIZE, (0, 0, 0, 0))
    for layer, position in zip(layers, positions, strict=True):
        transparent.alpha_composite(layer, tuple(position))
        layer.close()
    transparent.save(transparent_path, format="PNG", compress_level=7)
    background = Image.new("RGBA", OUTPUT_SIZE, BACKGROUND_COLOUR)
    background.alpha_composite(transparent)
    background.convert("RGB").save(background_path, format="PNG", compress_level=7)
    background.close()
    transparent.close()


def selected_pages(requested_slugs: list[str]) -> list[Path]:
    pages = sorted(CONTENT_DIR.glob("*.mdx"))
    if not requested_slugs:
        return pages
    requested = {slug.removesuffix(".mdx") for slug in requested_slugs}
    available = {page.stem for page in pages}
    missing = requested - available
    if missing:
        raise ValueError(f"unknown page slug(s): {', '.join(sorted(missing))}")
    return [page for page in pages if page.stem in requested]


def main() -> int:
    args = parse_args()
    if args.variants < 1:
        print("--variants must be at least 1", file=sys.stderr)
        return 2
    if not SOURCE_DIR.is_dir():
        print(f"Local source directory not found: {SOURCE_DIR}", file=sys.stderr)
        return 1
    try:
        pages = selected_pages(args.page)
    except ValueError as error:
        print(error, file=sys.stderr)
        return 2

    rows = read_database()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    cache = ProductCache()
    failures: list[str] = []
    for page in pages:
        try:
            models = page_models(page)
            candidates = eligible_products(rows, models, page.stem)
            variants = plan_variants(candidates, page.stem, args.variants)
            for number, products in enumerate(variants, start=1):
                filename = f"{page.stem}-{number}.png"
                transparent_filename = f"{page.stem}-{number}-transparent.png"
                render(
                    products,
                    args.output_dir / filename,
                    args.output_dir / transparent_filename,
                    cache,
                )
                selection = ", ".join(
                    f'{row["SKU"]} ({row["model"]}, {row["kind"]})'
                    for row, _ in products
                )
                print(f"{page.stem}: {number}/{args.variants}: {selection}", flush=True)
        except Exception as error:
            failures.append(f"{page.stem}: {error}")

    if failures:
        print("\nFailed pages:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print(f"\nGenerated {len(pages) * args.variants * 2} images in {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
