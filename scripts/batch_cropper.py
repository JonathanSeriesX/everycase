#!/usr/bin/env python3
"""Batch crop 4608x4608 (or similar) source images using per-product specs.

Specs live in a CSV (see crop_specs.csv) and can reference products from
database.csv via simple match expressions or explicit SKU/file globs.
"""

from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Set

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover - makes failure mode obvious
    raise SystemExit(
        "Pillow is required. Install it via 'pip install Pillow'."
    ) from exc

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE = SCRIPT_DIR / "database.csv"
DEFAULT_SPECS = SCRIPT_DIR / "crop_specs.csv"
DEFAULT_SOURCE = "/Volumes/Storage/Images/1_final-sources"
DEFAULT_OUTPUT = "/Volumes/Storage/Images/crop_town"
DEFAULT_EXTENSIONS = ".png"
COLUMN_SEPARATOR = ";"  # separates clauses inside `match`


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--database",
        type=Path,
        default=DEFAULT_DATABASE,
        help="CSV with master catalog (default: database.csv).",
    )
    parser.add_argument(
        "--specs",
        type=Path,
        default=DEFAULT_SPECS,
        help="CSV describing crop instructions (default: crop_specs.csv).",
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=DEFAULT_SOURCE,
        help="Folder containing downloaded source PNGs (default: scripts/tmp).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Destination folder for cropped assets.",
    )
    parser.add_argument(
        "--extensions",
        type=str,
        default=DEFAULT_EXTENSIONS,
        help="Comma-separated list of extensions to probe for each SKU/file.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite destination files instead of skipping them.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Resolve matches and print the plan without writing files.",
    )
    return parser.parse_args()


def load_database(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Database CSV not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows: List[Dict[str, str]] = []
        for raw in reader:
            normalized = {
                (key or "").strip().lower(): (value or "").strip()
                for key, value in raw.items()
            }
            rows.append(normalized)
    return rows


def normalize_tokens(value: str) -> List[str]:
    if not value:
        return []
    separators = [",", "|", ";", " "]
    current = [value]
    for sep in separators:
        temp: List[str] = []
        for chunk in current:
            temp.extend(chunk.split(sep))
        current = temp
    return [token for token in (token.strip() for token in current) if token]


def parse_int(value: str, field_name: str) -> int:
    value = (value or "").strip()
    if not value:
        return 0
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(
            f"Column '{field_name}' expects an integer, got '{value}'."
        ) from exc


@dataclass
class CropSpec:
    label: str
    left: int
    top: int
    right: int
    bottom: int
    match_expr: str = ""
    skus: List[str] = field(default_factory=list)
    glob: str = ""
    extra_suffixes: List[str] = field(default_factory=list)
    output_subdir: str = ""
    output_suffix: str = ""

    @property
    def has_selector(self) -> bool:
        return bool(self.match_expr or self.skus or self.glob)


def load_specs(path: Path) -> List[CropSpec]:
    if not path.exists():
        raise FileNotFoundError(f"Spec file not found: {path}")
    specs: List[CropSpec] = []
    with path.open("r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required_columns = {"label", "left", "top", "right", "bottom"}
        missing = required_columns - {col.lower() for col in reader.fieldnames or []}
        if missing:
            raise ValueError(f"Spec file missing required columns: {sorted(missing)}")

        for row in reader:
            label = (row.get("label") or "").strip()
            if not label or label.startswith("#"):
                continue
            spec = CropSpec(
                label=label,
                match_expr=(row.get("match") or "").strip(),
                skus=normalize_tokens(row.get("skus") or ""),
                glob=(row.get("glob") or "").strip(),
                extra_suffixes=normalize_tokens(row.get("extra_suffixes") or ""),
                left=parse_int(row.get("left"), "left"),
                top=parse_int(row.get("top"), "top"),
                right=parse_int(row.get("right"), "right"),
                bottom=parse_int(row.get("bottom"), "bottom"),
                output_subdir=(row.get("output_subdir") or "").strip(),
                output_suffix=(row.get("output_suffix") or "").strip(),
            )
            if not spec.has_selector:
                raise ValueError(
                    f"Spec '{label}' must provide at least one of match/skus/glob."
                )
            specs.append(spec)
    return specs


def filter_database(rows: Sequence[Dict[str, str]], expr: str) -> List[Dict[str, str]]:
    if not expr:
        return []
    clauses = [
        clause.strip() for clause in expr.split(COLUMN_SEPARATOR) if clause.strip()
    ]
    if not clauses:
        return []
    matched = list(rows)
    for clause in clauses:
        if "~" in clause:
            key, value = clause.split("~", 1)
            key = key.strip().lower()
            needle = value.strip().lower()
            matched = [row for row in matched if needle in row.get(key, "").lower()]
        elif "=" in clause:
            key, value = clause.split("=", 1)
            key = key.strip().lower()
            target = value.strip()
            matched = [row for row in matched if row.get(key, "") == target]
        else:
            raise ValueError(
                f"Unsupported clause '{clause}' in expression '{expr}'. "
                f"Use '~' for contains or '=' for exact matches."
            )
    return matched


def find_file_for_code(
    code: str,
    source_dir: Path,
    extensions: Sequence[str],
) -> Path | None:
    for ext in extensions:
        candidate = source_dir / f"{code}{ext}"
        if candidate.exists():
            return candidate
    return None


def gather_paths_for_spec(
    spec: CropSpec,
    database_rows: Sequence[Dict[str, str]],
    source_dir: Path,
    extensions: Sequence[str],
) -> List[Path]:
    resolved: List[Path] = []
    seen: Set[Path] = set()

    def add_path(path: Path) -> None:
        if path not in seen and path.is_file():
            resolved.append(path)
            seen.add(path)

    def add_code(
        code: str,
        warn_context: str,
        include_suffixes: bool,
    ) -> None:
        file_path = find_file_for_code(code, source_dir, extensions)
        if file_path:
            add_path(file_path)
        else:
            print(
                f"[warn] Missing file for {warn_context} '{code}' in spec '{spec.label}'."
            )
        if include_suffixes and spec.extra_suffixes:
            for suffix in spec.extra_suffixes:
                variant_code = f"{code}{suffix}"
                variant_path = find_file_for_code(variant_code, source_dir, extensions)
                if variant_path:
                    add_path(variant_path)
                else:
                    print(
                        f"[warn] Missing variant '{variant_code}' ({warn_context}) "
                        f"in spec '{spec.label}'."
                    )

    for sku in spec.skus:
        add_code(sku, "SKU", include_suffixes=False)

    if spec.match_expr:
        matched_rows = filter_database(database_rows, spec.match_expr)
        if not matched_rows:
            print(
                f"[warn] Match '{spec.match_expr}' returned 0 rows for '{spec.label}'."
            )
        for row in matched_rows:
            sku = row.get("sku", "")
            if not sku:
                continue
            add_code(sku, "matched SKU", include_suffixes=True)

    if spec.glob:
        for file_path in source_dir.glob(spec.glob):
            add_path(file_path)

    return resolved


def crop_single_image(
    src: Path,
    dest: Path,
    left: int,
    top: int,
    right: int,
    bottom: int,
) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        width, height = im.size
        if left < 0 or top < 0 or right < 0 or bottom < 0:
            raise ValueError("Crop values must be non-negative integers.")
        if left + right >= width or top + bottom >= height:
            raise ValueError(
                f"Cropping {src.name} by L{left}+R{right} / T{top}+B{bottom} "
                "would eliminate the entire image."
            )
        crop_box = (left, top, width - right, height - bottom)
        cropped = im.crop(crop_box)
        cropped.save(dest)


def main() -> None:
    args = parse_args()
    database_rows: List[Dict[str, str]] = []
    if args.database:
        database_rows = load_database(
            args.database
            if args.database.is_absolute()
            else (SCRIPT_DIR / args.database)
        )

    specs = load_specs(
        args.specs if args.specs.is_absolute() else (SCRIPT_DIR / args.specs)
    )
    source_dir = (
        args.source_dir
        if args.source_dir.is_absolute()
        else (SCRIPT_DIR / args.source_dir)
    )
    output_dir = (
        args.output_dir
        if args.output_dir.is_absolute()
        else (SCRIPT_DIR / args.output_dir)
    )
    if not source_dir.exists():
        raise SystemExit(f"Source directory not found: {source_dir}")
    output_dir.mkdir(parents=True, exist_ok=True)
    extensions = tuple(
        ext if ext.startswith(".") else f".{ext}"
        for ext in (token.strip().lower() for token in args.extensions.split(","))
        if ext
    )
    if not extensions:
        raise SystemExit("At least one extension must be provided.")

    total_written = 0
    total_skipped = 0
    total_planned = 0
    for spec in specs:
        targets = gather_paths_for_spec(spec, database_rows, source_dir, extensions)
        if not targets:
            print(f"[info] Spec '{spec.label}' matched 0 files.")
            continue
        for image_path in targets:
            suffix = spec.output_suffix or ""
            dest_name = image_path.stem + suffix + image_path.suffix
            dest_dir = output_dir
            if spec.output_subdir:
                dest_dir = output_dir / spec.output_subdir
            dest_path = dest_dir / dest_name

            if dest_path.exists() and not args.overwrite:
                print(f"[skip] {dest_path} already exists.")
                total_skipped += 1
                continue

            total_planned += 1
            print(
                f"[{'dry' if args.dry_run else 'crop'}] {image_path.name} "
                f"-> {dest_path.relative_to(output_dir)} "
                f"(L{spec.left}/T{spec.top}/R{spec.right}/B{spec.bottom})"
            )
            if args.dry_run:
                continue
            crop_single_image(
                image_path,
                dest_path,
                left=spec.left,
                top=spec.top,
                right=spec.right,
                bottom=spec.bottom,
            )
            total_written += 1

    if args.dry_run:
        print(
            f"\nDry-run complete. {total_planned} images would be written "
            f"({total_skipped} skipped)."
        )
    else:
        print(f"\nDone. Wrote {total_written} cropped files ({total_skipped} skipped).")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover - convenience for CLI usage
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
