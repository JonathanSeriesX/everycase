#!/usr/bin/env python3
"""everycase asset pipeline — one entrypoint for the whole image lifecycle.

    python assets.py <command>

Sources of truth
  - 1_final-sources/*.png : the IMAGES. Authoritative; hold crops/manual work.
  - database.csv          : the case MODELS (catalog).
  - variants.csv          : DERIVED index (code -> sku, download_res, crop).
                            Regenerated from the drive by `index`; read by the
                            website. Never authoritative.

Forward intake (for images that don't exist yet)
  - list.txt              : `code,download_res[,crop]` rows you want to ADD.
                            `fetch` pulls them into 1_final-sources.

Commands (each is idempotent — re-running skips work already done)
  discover <apple.json>   parse an Apple category JSON, list SKUs not yet in
                          database.csv (with title + price to paste in).
  fetch                   download intake codes (list.txt) into 1_final-sources.
  transform               apply crop_specs.csv crops to 1_final-sources.
  build                   compress 1_final-sources -> avif/webp previews.
  sync                    rclone previews/sources to R2, then re-index.
  index                   regenerate variants.csv from the drive truth.
  all                     fetch -> transform -> build -> sync (and index).
"""

from __future__ import annotations

import argparse
import csv
import json
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

import batch_cropper as bc

# --------------------------------------------------------------------------- #
# CONFIG — the single place paths/remotes live (also injected into the .sh).
# --------------------------------------------------------------------------- #
SCRIPT_DIR = Path(__file__).resolve().parent
STORAGE = Path("/Volumes/Storage/Images")

FINAL_SOURCES = STORAGE / "1_final-sources"          # image source of truth
COMPRESSED_SOURCES = STORAGE / "2_compressed-sources"  # webp 2048 lossless
AVIF_PREVIEWS = STORAGE / "3_compressed-avif-previews"
WEBP_PREVIEWS = STORAGE / "3_compressed-webp-previews"
CROP_STAGING = STORAGE / "crop_town"                 # transform output (review then move)
R2_REMOTE = "R2:everycase-images"

DATABASE = SCRIPT_DIR / "database.csv"
CROP_SPECS = SCRIPT_DIR / "crop_specs.csv"
VARIANTS = SCRIPT_DIR / "variants.csv"
INTAKE = SCRIPT_DIR / "list.txt"
SOURCE_IMAGES = SCRIPT_DIR / "source_images.txt"  # legacy, retired; drift check

DEFAULT_RES = 4608
CDN_TEMPLATE = (
    "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is/"
    "{code}?wid={wid}&hei={hei}&fmt=png-alpha"
)


def _require_drive() -> None:
    if not FINAL_SOURCES.is_dir():
        raise SystemExit(
            f"Image source of truth not mounted: {FINAL_SOURCES}\n"
            "Mount the Storage drive and try again."
        )


def parse_res(value: str) -> Tuple[int, int]:
    cleaned = (value or "").lower().replace(" ", "")
    if not cleaned:
        return DEFAULT_RES, DEFAULT_RES
    w, _, h = cleaned.partition("x")
    return int(w), int(h or w)


# --------------------------------------------------------------------------- #
# index — regenerate variants.csv from the drive (the only authoritative pass)
# --------------------------------------------------------------------------- #
def load_skus() -> set:
    with DATABASE.open(encoding="utf-8") as fh:
        return {row["SKU"].strip() for row in csv.DictReader(fh) if row.get("SKU")}


def sku_of(code: str) -> str:
    """Apple SKUs carry no underscore; variant suffixes (_AVnn, _cut) do."""
    return code.split("_")[0]


def build_crop_map(codes: List[str]):
    """code -> spec label, and label -> (L,T,R,B), mirroring batch_cropper."""
    import fnmatch

    rows = bc.load_database(DATABASE)
    specs = bc.load_specs(CROP_SPECS)
    code_set = set(codes)
    code_to_label: Dict[str, str] = {}
    label_box: Dict[str, Tuple[int, int, int, int]] = {}

    for spec in specs:
        label_box[spec.label] = (spec.left, spec.top, spec.right, spec.bottom)
        targets: set = set(spec.skus)
        if spec.match_expr:
            for row in bc.filter_database(rows, spec.match_expr):
                sku = row.get("sku", "")
                if not sku:
                    continue
                targets.add(sku)
                for suffix in spec.extra_suffixes:
                    targets.add(f"{sku}{suffix}")
        if spec.glob:
            pat = spec.glob[:-4] if spec.glob.endswith(".png") else spec.glob
            targets.update(c for c in codes if fnmatch.fnmatch(c, pat))
        for code in targets & code_set:
            code_to_label[code] = spec.label
    return code_to_label, label_box


def read_dimensions(path: Path) -> Optional[Tuple[int, int]]:
    try:
        from PIL import Image

        with Image.open(path) as im:
            return im.size
    except Exception:
        return None


def cmd_index(args: argparse.Namespace) -> int:
    _require_drive()
    codes = sorted({p.stem for p in FINAL_SOURCES.glob("*.png")})
    skus = load_skus()
    code_to_label, label_box = build_crop_map(codes)
    txt_codes = (
        {l.strip() for l in SOURCE_IMAGES.read_text().splitlines() if l.strip()}
        if SOURCE_IMAGES.is_file()
        else set()
    )

    rows: List[Dict[str, str]] = []
    stats = {"default": 0, "cropped": 0, "custom": 0, "orphan": 0, "flagged": 0}

    for code in codes:
        sku = sku_of(code)
        notes: List[str] = []
        download_res = ""
        crop = code_to_label.get(code, "")

        if sku not in skus:
            notes.append("sku not in database.csv (MDX-catalogued?)")
            stats["orphan"] += 1

        dims = read_dimensions(FINAL_SOURCES / f"{code}.png")
        if dims is None:
            notes.append("unreadable PNG header")
        else:
            w, h = dims
            if crop:
                left, top, right, bottom = label_box[crop]
                dl_w, dl_h = w + left + right, h + top + bottom
                if (dl_w, dl_h) == (DEFAULT_RES, DEFAULT_RES):
                    stats["cropped"] += 1
                else:
                    download_res = f"{dl_w}x{dl_h}"
                    notes.append(f"crop+custom-res: final {w}x{h} -> dl {dl_w}x{dl_h}; verify")
                    stats["flagged"] += 1
            elif (w, h) == (DEFAULT_RES, DEFAULT_RES):
                stats["default"] += 1
            else:
                download_res = f"{w}x{h}"
                notes.append("auto: custom download res (or undocumented crop?) — verify")
                stats["custom"] += 1
                stats["flagged"] += 1

        rows.append(
            {"code": code, "sku": sku, "download_res": download_res, "crop": crop, "note": "; ".join(notes)}
        )

    with VARIANTS.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["code", "sku", "download_res", "crop", "note"])
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows -> {VARIANTS}")
    print("  default={default} cropped={cropped} custom={custom} orphan={orphan} flagged={flagged}".format(**stats))
    stale = sorted(txt_codes - set(codes))
    if stale:
        print(f"  source_images.txt has {len(stale)} stale codes (not on drive) — safe to drop.")
    return 0


# --------------------------------------------------------------------------- #
# discover — find SKUs in an Apple category JSON that aren't in database.csv
# --------------------------------------------------------------------------- #
def _find_tiles(obj) -> list:
    if isinstance(obj, dict):
        if "basePartNumber" in obj:
            return [obj]
        out = []
        for v in obj.values():
            out += _find_tiles(v)
        return out
    if isinstance(obj, list):
        out = []
        for v in obj:
            out += _find_tiles(v)
        return out
    return []


def cmd_discover(args: argparse.Namespace) -> int:
    data = json.loads(Path(args.json).read_text(encoding="utf-8"))
    tiles = _find_tiles(data)
    known = load_skus()
    seen = set()
    new = []
    for t in tiles:
        sku = (t.get("basePartNumber") or "").strip()
        if not sku or sku in seen:
            continue
        seen.add(sku)
        if sku not in known:
            title = (t.get("title") or "").strip()
            price = ((t.get("productPrice") or {}).get("priceCurrent") or "").strip()
            new.append((sku, price, title))

    print(f"Parsed {len(seen)} products; {len(new)} not in database.csv:")
    for sku, price, title in new:
        print(f"  {sku:<8} {price:<8} {title}")
    if new and args.append_intake:
        with INTAKE.open("a", encoding="utf-8") as fh:
            for sku, _, _ in new:
                fh.write(f"{sku},{DEFAULT_RES}x{DEFAULT_RES}\n")
        print(f"\nAppended {len(new)} base codes to {INTAKE} (add _AVnn variants/crops as needed).")
    return 0


# --------------------------------------------------------------------------- #
# fetch — download intake codes into the image source of truth
# --------------------------------------------------------------------------- #
def load_intake() -> List[Tuple[str, Tuple[int, int]]]:
    if not INTAKE.is_file():
        return []
    out = []
    for raw in INTAKE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.endswith(":") or "," not in line:
            continue
        code, _, rest = line.partition(",")
        res = rest.split(",")[0].strip()  # ignore trailing crop column if present
        out.append((code.strip(), parse_res(res)))
    return out


def cmd_fetch(args: argparse.Namespace) -> int:
    _require_drive()
    FINAL_SOURCES.mkdir(parents=True, exist_ok=True)
    tasks = load_intake()
    if not tasks:
        print(f"No intake entries in {INTAKE}.")
        return 0

    fetched = skipped = failed = 0
    for code, (wid, hei) in tasks:
        dest = FINAL_SOURCES / f"{code}.png"
        if dest.is_file() and dest.stat().st_size > 0:
            skipped += 1
            continue
        url = CDN_TEMPLATE.format(code=code, wid=wid, hei=hei)
        try:
            resp = requests.get(url, timeout=20)
        except requests.RequestException as exc:
            print(f"  [err]  {code}: {exc}")
            failed += 1
            continue
        if resp.status_code != 200 or not resp.headers.get("content-type", "").startswith("image/"):
            print(f"  [skip] {code}: HTTP {resp.status_code} {resp.headers.get('content-type','')}")
            failed += 1
            continue
        dest.write_bytes(resp.content)
        print(f"  [get]  {code} ({wid}x{hei})")
        fetched += 1

    print(f"fetch: {fetched} downloaded, {skipped} already present, {failed} unavailable.")
    print("Note: cropped variants come from `transform`; new files are indexed by `index`.")
    return 0


# --------------------------------------------------------------------------- #
# transform / build / sync — delegate to the proven cropper & shell scripts
# --------------------------------------------------------------------------- #
def cmd_transform(args: argparse.Namespace) -> int:
    _require_drive()
    # Crop into a staging dir, NOT in place: some specs have an empty
    # output_suffix and would otherwise overwrite the source-of-truth file.
    # Review crop_town, then move approved crops into 1_final-sources.
    cmd = [
        sys.executable,
        str(SCRIPT_DIR / "batch_cropper.py"),
        "--source-dir", str(FINAL_SOURCES),
        "--output-dir", str(CROP_STAGING),
    ]
    if getattr(args, "dry_run", False):
        cmd.append("--dry-run")
    rc = subprocess.call(cmd)
    if rc == 0 and not getattr(args, "dry_run", False):
        print(f"\nCrops written to {CROP_STAGING}. Review, then move approved files")
        print(f"into {FINAL_SOURCES} (the image source of truth) before `build`.")
    return rc


# Preview/source encodings (params match the retired 3_compress.sh exactly).
AVIF_ARGS = ["-resize", "512x512", "-quality", "90", "-strip", "-filter", "Lanczos",
             "-define", "avif:codec=aom", "-define", "avif:speed=0"]
WEBP_ARGS = ["-resize", "2048x2048", "-define", "webp:lossless=true", "-strip",
             "-filter", "Lanczos", "-define", "webp:method=6"]


def _is_stale(src: Path, out: Path) -> bool:
    """Recompress when the output is missing OR older than its source."""
    return not out.is_file() or src.stat().st_mtime > out.stat().st_mtime


def cmd_build(args: argparse.Namespace) -> int:
    _require_drive()
    if not shutil.which("magick"):
        raise SystemExit("ImageMagick `magick` not found on PATH; cannot compress.")

    AVIF_PREVIEWS.mkdir(parents=True, exist_ok=True)
    COMPRESSED_SOURCES.mkdir(parents=True, exist_ok=True)

    jobs: List[Tuple[Path, Path, List[str]]] = []
    for src in sorted(FINAL_SOURCES.glob("*.png")):
        avif = AVIF_PREVIEWS / f"{src.stem}.avif"
        webp = COMPRESSED_SOURCES / f"{src.stem}.webp"
        if args.force or _is_stale(src, avif):
            jobs.append((src, avif, AVIF_ARGS))
        if args.force or _is_stale(src, webp):
            jobs.append((src, webp, WEBP_ARGS))

    if not jobs:
        print("build: everything up to date.")
        return 0
    print(f"build: {len(jobs)} (re)compressions needed.")
    if args.dry_run:
        for src, out, _ in jobs[:40]:
            print(f"  [dry] {src.name} -> {out.relative_to(STORAGE)}")
        if len(jobs) > 40:
            print(f"  ... and {len(jobs) - 40} more")
        return 0

    failures: List[str] = []

    def run(job: Tuple[Path, Path, List[str]]) -> None:
        src, out, fmt_args = job
        try:
            subprocess.run(["magick", str(src), *fmt_args, str(out)], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as exc:
            failures.append(f"{out.name}: {exc.stderr.decode(errors='ignore').strip()[:120]}")

    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        list(pool.map(run, jobs))

    done = len(jobs) - len(failures)
    print(f"build: {done} written, {len(failures)} failed.")
    for f in failures[:20]:
        print(f"  [fail] {f}")
    return 1 if failures else 0


def cmd_sync(args: argparse.Namespace) -> int:
    if not shutil.which("rclone"):
        raise SystemExit("`rclone` not found on PATH; cannot sync.")
    copies = [
        (COMPRESSED_SOURCES, f"{R2_REMOTE}/everyimage"),
        (AVIF_PREVIEWS, f"{R2_REMOTE}/everypreview"),
        (WEBP_PREVIEWS, f"{R2_REMOTE}/everypreview"),
    ]
    for local, remote in copies:
        if not local.is_dir():
            continue
        rc = subprocess.call(
            ["rclone", "copy", str(local), remote, "--progress", "--exclude", ".DS_Store"]
        )
        if rc != 0:
            print(f"Stopping: rclone copy {local} returned {rc}.")
            return rc
    print("\nRe-indexing after sync...")
    cmd_index(args)
    return 0


def cmd_all(args: argparse.Namespace) -> int:
    for step in (cmd_fetch, cmd_transform, cmd_build, cmd_sync):
        rc = step(args)
        if rc != 0:
            print(f"Stopping: {step.__name__} returned {rc}.")
            return rc
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("discover", help="list new SKUs from an Apple category JSON")
    p.add_argument("json", help="path to the Apple category JSON dump")
    p.add_argument("--append-intake", action="store_true", help="append new base codes to list.txt")
    p.set_defaults(func=cmd_discover)

    for name, func, help_text in [
        ("fetch", cmd_fetch, "download intake codes into 1_final-sources"),
        ("build", cmd_build, "compress sources into avif/webp previews"),
        ("sync", cmd_sync, "rclone to R2, then re-index"),
        ("index", cmd_index, "regenerate variants.csv from the drive"),
        ("all", cmd_all, "fetch -> transform -> build -> sync"),
    ]:
        sp = sub.add_parser(name, help=help_text)
        sp.set_defaults(func=func)

    sp = sub.add_parser("transform", help="apply crop_specs.csv crops")
    sp.add_argument("--dry-run", action="store_true")
    sp.set_defaults(func=cmd_transform)

    args = parser.parse_args()
    return args.func(args) or 0


if __name__ == "__main__":
    sys.exit(main())
