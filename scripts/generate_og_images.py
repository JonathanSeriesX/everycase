#!/usr/bin/env python3
"""Generate deterministic OG image choices for every iPhone landing page.

The renderer uses the local transparent PNG masters, never CDN previews. Each
composition is written twice: once on the reference image's #f1f1f1 backdrop
and once with a transparent background.
"""

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
CONTENT_DIR = REPO_ROOT / "content" / "iphone"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "og"
SOURCE_DIR = Path("/Volumes/Storage/Images/1_final-sources")

MODEL_PATTERN = re.compile(r'\bmodel:\s*["\']([^"\']+)["\']')
OUTPUT_SIZE = (2400, 1260)
CANVAS_SIZE = (4000, 4000)
CASE_SIZE = (1600, 1600)
NORMALIZED_OBJECT_HEIGHT = 1320
NORMALIZED_OBJECT_MAX_WIDTH = 700
BACKGROUND_COLOUR = (241, 241, 241, 255)

# These are the original og-image.js values at 2x. Sharp's angles are
# clockwise; Pillow's are counter-clockwise, hence the converted values.
ROTATIONS = (210, 120, 300, 30)
POSITIONS = ((720, 260), (2000, 340), (160, 1400), (1440, 1480))

# Closed snap-on cases match the reference composition. Sleeves and folios
# have a different silhouette and were the source of the bad overlaps.
EXCLUDED_KINDS = ("folio", "sleeve", "crossbody", "strap")
ALLOWED_NON_CASE_KINDS = {"bumper"}
PAGE_EXCLUDED_KINDS = {
    "iphone-6": ("smart battery case",),
    "iphone-7": ("smart battery case",),
    "iphone-17": ("beats",),
    "iphone-air": ("beats",),
}
SYMMETRIC_MULTI_MODEL_PAGES = {"iphone-6", "iphone-7", "iphone-17"}
CASES_PER_IMAGE = 4
DEFAULT_VARIANTS = 20
RESIZED_CACHE_LIMIT = 24
COLLISION_NUDGE = 12
MAX_COLLISION_PASSES = 100


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"output directory (default: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument(
        "--variants",
        type=int,
        default=DEFAULT_VARIANTS,
        help=f"compositions per page (default: {DEFAULT_VARIANTS})",
    )
    parser.add_argument(
        "--page",
        action="append",
        default=[],
        help="page slug to render; repeat for multiple pages (default: all)",
    )
    parser.add_argument(
        "--config",
        type=Path,
        help="render exact clean-named selections from an OG selection CSV",
    )
    return parser.parse_args()


def read_database() -> list[dict[str, str]]:
    with DATABASE_PATH.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def page_models(page_path: Path) -> list[str]:
    text = page_path.read_text(encoding="utf-8")
    return list(dict.fromkeys(MODEL_PATTERN.findall(text)))


def base_asset(sku: str) -> Path:
    return SOURCE_DIR / f"{sku}.png"


def kind_is_supported(kind: str) -> bool:
    normalized = kind.casefold()
    return (
        not any(excluded in normalized for excluded in EXCLUDED_KINDS)
        and ("case" in normalized or normalized in ALLOWED_NON_CASE_KINDS)
    )


def eligible_cases(
    rows: list[dict[str, str]], models: list[str], page_slug: str
) -> list[tuple[dict[str, str], Path]]:
    eligible_models = set(models)
    page_exclusions = PAGE_EXCLUDED_KINDS.get(page_slug, ())
    candidates = [
        (row, base_asset(row["SKU"]))
        for row in rows
        if row["model"] in eligible_models
        and kind_is_supported(row["kind"])
        and not any(
            excluded in row["kind"].casefold() for excluded in page_exclusions
        )
        and base_asset(row["SKU"]).is_file()
    ]

    unique_skus = {row["SKU"] for row, _ in candidates}
    if len(unique_skus) < CASES_PER_IMAGE:
        raise ValueError(
            f"{page_slug}: needs four local case masters, found {len(unique_skus)}"
        )
    return candidates


def variant_seed(page_slug: str, variant: int, retry: int = 0) -> int:
    value = f"{page_slug}:{variant}:{retry}".encode()
    return int.from_bytes(hashlib.sha256(value).digest()[:8], "big")


def choose_cases(
    candidates: list[tuple[dict[str, str], Path]], rng: random.Random
) -> list[tuple[dict[str, str], Path]]:
    """Choose four distinct products, favouring model and colour variety."""
    remaining = candidates.copy()
    rng.shuffle(remaining)
    selected: list[tuple[dict[str, str], Path]] = []
    used_skus: set[str] = set()
    used_colours: set[str] = set()
    model_counts: dict[str, int] = {}
    kind_counts: dict[str, int] = {}

    for _ in range(CASES_PER_IMAGE):
        choices = [item for item in remaining if item[0]["SKU"] not in used_skus]
        choices.sort(
            key=lambda item: (
                model_counts.get(item[0]["model"], 0),
                item[0]["colour"].casefold() in used_colours,
                kind_counts.get(item[0]["kind"], 0),
                rng.random(),
            )
        )
        row, asset = choices[0]
        selected.append((row, asset))
        used_skus.add(row["SKU"])
        used_colours.add(row["colour"].casefold())
        model_counts[row["model"]] = model_counts.get(row["model"], 0) + 1
        kind_counts[row["kind"]] = kind_counts.get(row["kind"], 0) + 1

    rng.shuffle(selected)
    return selected


def plan_variants(
    candidates: list[tuple[dict[str, str], Path]],
    models: list[str],
    page_slug: str,
    count: int,
) -> list[list[tuple[dict[str, str], Path]]]:
    planned: list[list[tuple[dict[str, str], Path]]] = []
    used_orders: set[tuple[str, ...]] = set()

    for variant in range(1, count + 1):
        selection = None
        signature = None
        for retry in range(200):
            rng = random.Random(variant_seed(page_slug, variant, retry))
            candidate_selection = choose_cases(candidates, rng)
            if page_slug in SYMMETRIC_MULTI_MODEL_PAGES:
                candidate_selection = arrange_models_symmetrically(
                    candidate_selection, rng
                )
                available_model_count = len(
                    {row["model"] for row, _ in candidates if row["model"] in models}
                )
                expected_model_count = min(CASES_PER_IMAGE, available_model_count)
                if (
                    len({row["model"] for row, _ in candidate_selection})
                    != expected_model_count
                ):
                    continue
            candidate_signature = tuple(row["SKU"] for row, _ in candidate_selection)
            if candidate_signature not in used_orders:
                selection = candidate_selection
                signature = candidate_signature
                break
        if selection is None or signature is None:
            raise ValueError(f"{page_slug}: could not create {count} unique variants")
        used_orders.add(signature)
        planned.append(selection)
    return planned


def arrange_models_symmetrically(
    selected: list[tuple[dict[str, str], Path]], rng: random.Random
) -> list[tuple[dict[str, str], Path]]:
    """Place repeated models in opposing slots while preserving model variety."""
    by_model: dict[str, list[tuple[dict[str, str], Path]]] = {}
    for item in selected:
        by_model.setdefault(item[0]["model"], []).append(item)
    groups = list(by_model.values())
    for group in groups:
        rng.shuffle(group)

    paired_groups = [group for group in groups if len(group) == 2]
    single_groups = [group for group in groups if len(group) == 1]

    # Two regular and two Plus cases: each model occupies one diagonal.
    if len(paired_groups) == 2 and not single_groups:
        rng.shuffle(paired_groups)
        first, second = paired_groups
        return [first[0], second[0], second[1], first[1]]

    # Three models: put the repeated model on a diagonal and the other two on
    # the opposing diagonal. Alternate which diagonal carries the pair.
    if len(paired_groups) == 1 and len(single_groups) == 2:
        pair = paired_groups[0]
        rng.shuffle(single_groups)
        singles = [single_groups[0][0], single_groups[1][0]]
        if rng.choice((False, True)):
            return [pair[0], singles[0], singles[1], pair[1]]
        return [singles[0], pair[0], pair[1], singles[1]]

    rng.shuffle(selected)
    return selected


class ResizedImageCache:
    """Small LRU cache; full-size masters are large enough to exhaust RAM."""

    def __init__(self, limit: int = RESIZED_CACHE_LIMIT) -> None:
        self.limit = limit
        self.images: OrderedDict[tuple[Path, bool], Image.Image] = OrderedDict()

    def get(self, path: Path, normalize: bool) -> Image.Image:
        key = (path, normalize)
        if key in self.images:
            image = self.images.pop(key)
            self.images[key] = image
            return image

        with Image.open(path) as source:
            image = normalize_case(source) if normalize else resize_source(source)
        self.images[key] = image
        if len(self.images) > self.limit:
            _, evicted = self.images.popitem(last=False)
            evicted.close()
        return image


def resize_source(source: Image.Image) -> Image.Image:
    """Reproduce the original square-master scaling used by early selections."""
    return source.convert("RGBA").resize(CASE_SIZE, Image.Resampling.LANCZOS)


def normalize_case(source: Image.Image) -> Image.Image:
    """Normalize the visible product, not its inconsistent source padding."""
    rgba = source.convert("RGBA")
    alpha_box = rgba.getbbox()
    if alpha_box is None:
        rgba.close()
        raise ValueError("source image is fully transparent")

    product = rgba.crop(alpha_box)
    rgba.close()
    scale = min(
        NORMALIZED_OBJECT_HEIGHT / product.height,
        NORMALIZED_OBJECT_MAX_WIDTH / product.width,
    )
    size = (
        max(1, round(product.width * scale)),
        max(1, round(product.height * scale)),
    )
    resized = product.resize(size, Image.Resampling.LANCZOS)
    product.close()

    normalized = Image.new("RGBA", CASE_SIZE, (0, 0, 0, 0))
    position = ((CASE_SIZE[0] - size[0]) // 2, (CASE_SIZE[1] - size[1]) // 2)
    normalized.alpha_composite(resized, position)
    resized.close()
    return normalized


def render(
    cases: list[tuple[dict[str, str], Path]],
    background_path: Path,
    transparent_path: Path,
    cache: ResizedImageCache,
    normalize: bool = True,
) -> None:
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))

    layers = [
        cache.get(asset, normalize).rotate(
            angle,
            resample=Image.Resampling.BICUBIC,
            expand=True,
            fillcolor=(0, 0, 0, 0),
        )
        for (_, asset), angle in zip(cases, ROTATIONS, strict=True)
    ]
    positions = [list(position) for position in POSITIONS]
    separate_colliding_layers(layers, positions)

    for layer, position in zip(layers, positions, strict=True):
        canvas.alpha_composite(layer, tuple(position))
        layer.close()

    crop_left = (CANVAS_SIZE[0] - OUTPUT_SIZE[0]) // 2
    crop_top = (CANVAS_SIZE[1] - OUTPUT_SIZE[1]) // 2
    crop_box = (
        crop_left,
        crop_top,
        crop_left + OUTPUT_SIZE[0],
        crop_top + OUTPUT_SIZE[1],
    )
    transparent = canvas.crop(crop_box)
    canvas.close()

    transparent.save(transparent_path, format="PNG", compress_level=7)
    background = Image.new("RGBA", OUTPUT_SIZE, BACKGROUND_COLOUR)
    background.alpha_composite(transparent)
    background.convert("RGB").save(background_path, format="PNG", compress_level=7)
    background.close()
    transparent.close()


def layers_overlap(
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

    first_global = (
        first_position[0] + first_box[0],
        first_position[1] + first_box[1],
        first_position[0] + first_box[2],
        first_position[1] + first_box[3],
    )
    second_global = (
        second_position[0] + second_box[0],
        second_position[1] + second_box[1],
        second_position[0] + second_box[2],
        second_position[1] + second_box[3],
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
        (
            intersection[0] - first_position[0],
            intersection[1] - first_position[1],
            intersection[2] - first_position[0],
            intersection[3] - first_position[1],
        )
    )
    second_crop = second_alpha.crop(
        (
            intersection[0] - second_position[0],
            intersection[1] - second_position[1],
            intersection[2] - second_position[0],
            intersection[3] - second_position[1],
        )
    )
    overlap = ImageChops.multiply(first_crop, second_crop).getbbox() is not None
    first_crop.close()
    second_crop.close()
    first_alpha.close()
    second_alpha.close()
    return overlap


def separate_colliding_layers(
    layers: list[Image.Image], positions: list[list[int]]
) -> None:
    directions = ((-1, -1), (1, -1), (-1, 1), (1, 1))
    for _ in range(MAX_COLLISION_PASSES):
        colliding: set[int] = set()
        for first in range(len(layers)):
            for second in range(first + 1, len(layers)):
                if layers_overlap(
                    layers[first], positions[first], layers[second], positions[second]
                ):
                    colliding.update((first, second))
        if not colliding:
            return
        for index in colliding:
            positions[index][0] += directions[index][0] * COLLISION_NUDGE
            positions[index][1] += directions[index][1] * COLLISION_NUDGE
    raise ValueError("could not separate colliding case layers")


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


def render_config(
    config_path: Path,
    output_dir: Path,
    rows: list[dict[str, str]],
    cache: ResizedImageCache,
) -> int:
    by_sku = {row["SKU"]: row for row in rows}
    with config_path.open(newline="", encoding="utf-8") as handle:
        selections = list(csv.DictReader(handle))
    required = {
        "page",
        "normalize",
        "slot_1_sku",
        "slot_2_sku",
        "slot_3_sku",
        "slot_4_sku",
    }
    if not selections or not required.issubset(selections[0]):
        raise ValueError(f"invalid OG selection config: {config_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_rows: list[dict[str, str | int]] = []
    for selection in selections:
        page = selection["page"]
        normalize = selection["normalize"].casefold() == "true"
        skus = [selection[f"slot_{slot}_sku"] for slot in range(1, 5)]
        missing = [sku for sku in skus if sku not in by_sku or not base_asset(sku).is_file()]
        if missing:
            raise ValueError(f"{page}: missing configured SKU(s): {', '.join(missing)}")
        cases = [(by_sku[sku], base_asset(sku)) for sku in skus]
        filename = f"{page}.png"
        transparent_filename = f"{page}-transparent.png"
        render(
            cases,
            output_dir / filename,
            output_dir / transparent_filename,
            cache,
            normalize=normalize,
        )
        manifest_rows.append(
            {
                "page": page,
                "variant": selection.get("source_attempt", ""),
                "background_file": filename,
                "transparent_file": transparent_filename,
                "skus": ";".join(skus),
                "models": ";".join(row["model"] for row, _ in cases),
                "kinds": ";".join(row["kind"] for row, _ in cases),
                "colours": ";".join(row["colour"] for row, _ in cases),
            }
        )
        print(f"{page}: configured selection", flush=True)

    manifest_path = output_dir / "manifest.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(manifest_rows[0]))
        writer.writeheader()
        writer.writerows(manifest_rows)
    return len(selections) * 2


def main() -> int:
    args = parse_args()
    if args.variants < 1:
        print("--variants must be at least 1", file=sys.stderr)
        return 2
    if not SOURCE_DIR.is_dir():
        print(f"Local source directory not found: {SOURCE_DIR}", file=sys.stderr)
        return 1

    rows = read_database()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    cache = ResizedImageCache()
    if args.config:
        if args.page:
            print("--config cannot be combined with --page", file=sys.stderr)
            return 2
        try:
            total = render_config(args.config, args.output_dir, rows, cache)
        except (OSError, ValueError) as error:
            print(error, file=sys.stderr)
            return 1
        print(f"\nGenerated {total} images in {args.output_dir}")
        return 0

    try:
        pages = selected_pages(args.page)
    except ValueError as error:
        print(error, file=sys.stderr)
        return 2
    failures: list[str] = []
    selected_slugs = {page.stem for page in pages}
    manifest_path = args.output_dir / "manifest.csv"
    manifest_rows: list[dict[str, str | int]] = []
    if manifest_path.is_file():
        with manifest_path.open(newline="", encoding="utf-8") as handle:
            manifest_rows.extend(
                row
                for row in csv.DictReader(handle)
                if row.get("page") not in selected_slugs
                and (args.output_dir / row.get("background_file", "")).is_file()
                and (args.output_dir / row.get("transparent_file", "")).is_file()
            )

    for page in pages:
        try:
            models = page_models(page)
            candidates = eligible_cases(rows, models, page.stem)
            variants = plan_variants(candidates, models, page.stem, args.variants)
            for number, cases in enumerate(variants, start=1):
                filename = f"{page.stem}-{number}.png"
                transparent_filename = f"{page.stem}-{number}-transparent.png"
                render(
                    cases,
                    args.output_dir / filename,
                    args.output_dir / transparent_filename,
                    cache,
                )
                manifest_rows.append(
                    {
                        "page": page.stem,
                        "variant": number,
                        "background_file": filename,
                        "transparent_file": transparent_filename,
                        "skus": ";".join(row["SKU"] for row, _ in cases),
                        "models": ";".join(row["model"] for row, _ in cases),
                        "kinds": ";".join(row["kind"] for row, _ in cases),
                        "colours": ";".join(row["colour"] for row, _ in cases),
                    }
                )
                print(f"{page.stem}: {number}/{args.variants}", flush=True)
        except Exception as error:
            failures.append(f"{page.stem}: {error}")

    if manifest_rows:
        with manifest_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(manifest_rows[0]))
            writer.writeheader()
            writer.writerows(manifest_rows)

    if failures:
        print("\nFailed pages:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    total = len(pages) * args.variants * 2
    print(f"\nGenerated {total} images in {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
