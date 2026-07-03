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
CATALOGUE_PATH = REPO_ROOT / "lib" / "catalogue.ts"
CATALOGUE_GROUP = "ipad"
SOURCE_DIR = Path("/Volumes/Storage/Images/1_final-sources")
DEFAULT_OUTPUT_DIR = Path("/Volumes/Storage/Images/og")
ALLOWED_KIND_PARTS = ("smart cover", "smart case", "smart folio")
OUTPUT_SIZE = (2400, 1260)
PRODUCT_CANVAS_SIZE = (2200, 2200)
PRODUCT_MAX_SIZE = (1600, 2000)
BACKGROUND_COLOUR = (241, 241, 241, 255)
ROTATIONS = (210, 30)
CENTRES = ((380, 520), (2020, 740))
DEFAULT_VARIANTS = 10
PRODUCTS_PER_IMAGE = 2
COLLISION_NUDGE = 12
MAX_COLLISION_PASSES = 100
# Once the two products no longer overlap, keep pushing them apart so the
# reference composition's wide white diagonal band survives the collision
# pass (which otherwise stops at the first pixel of separation).
EXTRA_SEPARATION = 110
RESIZED_CACHE_LIMIT = 20

# The composition needs the flat, fully closed front view. On the older pages
# the main SKU image shows the cover slightly ajar, so per-page rules restrict
# the SKU pool to lines that have a flat shot and name the _AV view that
# carries it ("" = the main image). Pages without an entry use every eligible
# SKU's main image. pro-97 has no flat view at all, so its variants alternate
# between the folded-triangle and stand views for the user to judge.
PAGE_ASSET_RULES: dict[str, dict] = {
    "air-2013": {
        "skus": {"MQ4L2", "MQ4M2", "MQ4N2", "MQ4P2", "MQ4Q2"},
        "views": [""],
    },
    "2": {
        "skus": {"MD454", "MD455", "MD456", "MD457", "MD458", "MD579"},
        "views": ["_AV4_BLACK"],
    },
    "mini-2012": {
        "skus": {"MD828", "MD963", "MD967", "MD968", "MD969", "MD970"},
        "views": ["_AV2"],
    },
    # No flat closed cover view exists for this line, so the page uses a
    # hand-picked pair of silicone shells instead: first SKU lands on the
    # left (the upside-down slot), second on the right.
    "pro-97": {
        "fixed": ("MMG42", "MM262"),
        "views": [""],
    },
    "pro-129": {
        "fixed": ("MK0E2", "MPV12"),
        "views": [""],
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--variants", type=int, default=DEFAULT_VARIANTS)
    parser.add_argument("--page", action="append", default=[])
    return parser.parse_args()


def read_database() -> list[dict[str, str]]:
    with DATABASE_PATH.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def catalogue_pages() -> "OrderedDict[str, list[str]]":
    """Read page slugs and their model lists from the site tree.

    The MDX files under content/ are prose-only since the App Router rewrite;
    lib/catalogue.ts is the single source of truth for which models belong to
    which landing page.
    """
    text = CATALOGUE_PATH.read_text(encoding="utf-8")
    group_match = re.search(rf'slug:\s*"{CATALOGUE_GROUP}"', text)
    if group_match is None:
        raise ValueError(f'no "{CATALOGUE_GROUP}" group in {CATALOGUE_PATH}')
    pages_start = text.index("pages: [", group_match.end())
    depth = 0
    for index in range(text.index("[", pages_start), len(text)):
        if text[index] == "[":
            depth += 1
        elif text[index] == "]":
            depth -= 1
            if depth == 0:
                break
    else:
        raise ValueError(f"unterminated pages array in {CATALOGUE_PATH}")
    section = text[pages_start:index]

    pages: "OrderedDict[str, list[str]]" = OrderedDict()
    slug = None
    token_pattern = re.compile(r'slug:\s*"([^"]+)"|models:\s*\[([^\]]*)\]')
    for match in token_pattern.finditer(section):
        if match.group(1) is not None:
            slug = match.group(1)
        elif slug is not None:
            pages[slug] = re.findall(r'"([^"]+)"', match.group(2))
            slug = None
    if not pages:
        raise ValueError(f'no pages parsed for "{CATALOGUE_GROUP}" group')
    return pages


def view_asset(sku: str, view: str = "") -> Path:
    return SOURCE_DIR / f"{sku}{view}.png"


def page_views(page_slug: str) -> list[str]:
    return PAGE_ASSET_RULES.get(page_slug, {}).get("views", [""])


def kind_is_supported(kind: str) -> bool:
    normalized = kind.casefold()
    return "keyboard" not in normalized and any(
        allowed in normalized for allowed in ALLOWED_KIND_PARTS
    )


def eligible_products(
    rows: list[dict[str, str]], models: list[str], page_slug: str
) -> list[tuple[dict[str, str], Path]]:
    eligible_models = set(models)
    rule = PAGE_ASSET_RULES.get(page_slug, {})
    allowed_skus = rule.get("skus")
    views = page_views(page_slug)
    candidates = [
        (row, view_asset(row["SKU"], views[0]))
        for row in rows
        if row["model"] in eligible_models
        and kind_is_supported(row["kind"])
        and (allowed_skus is None or row["SKU"] in allowed_skus)
        and all(view_asset(row["SKU"], view).is_file() for view in views)
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
            positions[0][0] -= EXTRA_SEPARATION
            positions[1][0] += EXTRA_SEPARATION
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


def selected_pages(requested_slugs: list[str]) -> "OrderedDict[str, list[str]]":
    pages = catalogue_pages()
    if not requested_slugs:
        return pages
    requested = [slug.removesuffix(".mdx") for slug in requested_slugs]
    missing = set(requested) - set(pages)
    if missing:
        raise ValueError(f"unknown page slug(s): {', '.join(sorted(missing))}")
    return OrderedDict((slug, pages[slug]) for slug in pages if slug in requested)


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
    for slug, models in pages.items():
        try:
            fixed = PAGE_ASSET_RULES.get(slug, {}).get("fixed")
            if fixed:
                by_sku = {row["SKU"]: row for row in rows}
                variants = [[(by_sku[sku], view_asset(sku)) for sku in fixed]]
            else:
                candidates = eligible_products(rows, models, slug)
                variants = plan_variants(candidates, slug, args.variants)
            views = page_views(slug)
            for number, products in enumerate(variants, start=1):
                # Cycle through the page's candidate views so pages with
                # several usable shots produce examples of each.
                view = views[(number - 1) % len(views)]
                products = [(row, view_asset(row["SKU"], view)) for row, _ in products]
                filename = f"ipad-{slug}-{number}.png"
                transparent_filename = f"ipad-{slug}-{number}-transparent.png"
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
                print(f"{slug}: {number}/{args.variants}: {selection}", flush=True)
        except Exception as error:
            failures.append(f"{slug}: {error}")

    if failures:
        print("\nFailed pages:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print(f"\nGenerated {len(pages) * args.variants * 2} images in {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
