"""Analyse padding in download/ PNGs and propose lower-resolution re-downloads.

The Apple CDN pads (does not scale) a fixed-size master render into whatever
canvas you request. Asking for 4608 often floats a small product in a sea of
alpha. This script measures each product's bounding box and proposes a smaller
canvas so the product fills a consistent fraction of the frame.

Two cases, distinguished by the colour at the corner of the alpha bounding box:

  * pure-alpha product  -> corner is transparent
        new_canvas = round(longest_bbox_side / TARGET_FILL)   (adds a gap)
  * white-rectangle art -> corner is opaque near-white
        new_canvas = longest_bbox_side                        (white IS the gap)

Both clamp to the original canvas and are only proposed when they reclaim at
least MIN_RECLAIM of the canvas, so already-tight images (e.g. the iPad hero
shots) are left alone.

Analysis-only by default: writes download2_list.txt + a report CSV. It does NOT
download anything. Feed the list to 2_image_downloader.py to fetch.
"""

import argparse
import subprocess
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_SOURCE = Path("/Volumes/Storage/Images/download")
DEFAULT_LIST = SCRIPT_DIR / "download2_list.txt"
DEFAULT_REPORT = SCRIPT_DIR / "download2_report.csv"

TARGET_FILL = 0.65          # product fills this fraction of the long side
MIN_RECLAIM = 0.10          # only re-download if we shrink the canvas >= this
MIN_CANVAS = 1000           # never re-download smaller than this (tiny masters)
WHITE_THRESHOLD = 250       # r,g,b all >= this (0-255) counts as "white"
CORNER_INSET = 8            # px inside the bbox corner to sample


@dataclass
class Analysis:
    code: str
    canvas: int
    bbox_long: int
    kind: str          # "white-rect" | "alpha" | "empty" | "error"
    new_canvas: int    # 0 => leave alone
    note: str = ""


def _im(args: list[str]) -> str:
    return subprocess.run(
        ["convert", *args], capture_output=True, text=True, timeout=60
    ).stdout.strip()


def analyse(path: Path) -> Analysis:
    code = path.stem
    try:
        w, h = _im([str(path), "-format", "%w %h", "info:"]).split()
        canvas = max(int(w), int(h))

        # Trim bounding box (%@) using the transparent corner as reference.
        trim = _im([str(path), "-format", "%@", "info:"])
        bw, rest = trim.split("x", 1)
        bh, xoff, yoff = rest.replace("+", " ").split()
        bbox_long = max(int(bw), int(bh))
        x, y = int(xoff), int(yoff)

        if bbox_long <= 0:
            return Analysis(code, canvas, 0, "empty", 0, "no content found")

        # Sample just inside the bbox corner to classify the padding.
        px = _im([str(path), "-format",
                  f"%[pixel:p{{{x + CORNER_INSET},{y + CORNER_INSET}}}]", "info:"])
        r, g, b, a = _parse_pixel(px)
        is_white_rect = a > 0.5 and min(r, g, b) >= WHITE_THRESHOLD

        if is_white_rect:
            new_canvas = bbox_long
            kind = "white-rect"
        else:
            new_canvas = round(bbox_long / TARGET_FILL)
            kind = "alpha"

        new_canvas = min(max(new_canvas, MIN_CANVAS), canvas)
        if new_canvas > canvas * (1 - MIN_RECLAIM):
            return Analysis(code, canvas, bbox_long, kind, 0,
                            f"fills {bbox_long/canvas:.0%} - leave alone")
        return Analysis(code, canvas, bbox_long, kind, new_canvas,
                        f"{bbox_long/canvas:.0%} -> {new_canvas}px")
    except Exception as exc:  # noqa: BLE001 - report and continue
        return Analysis(code, 0, 0, "error", 0, str(exc)[:80])


def _parse_pixel(px: str) -> tuple[float, float, float, float]:
    """Parse ImageMagick 'srgba(r,g,b,a)' / 'srgb(r,g,b)' into (r,g,b,a 0-1)."""
    inside = px[px.index("(") + 1:px.index(")")]
    parts = [p.strip() for p in inside.split(",")]
    r, g, b = (float(parts[i]) for i in range(3))
    a = float(parts[3]) if len(parts) > 3 else 1.0
    return r, g, b, a


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--list", type=Path, default=DEFAULT_LIST)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    pngs = sorted(args.source.glob("*.png"))
    print(f"Analysing {len(pngs)} PNGs in {args.source} ...")

    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(analyse, pngs))

    flagged = [r for r in results if r.new_canvas > 0]
    white = [r for r in flagged if r.kind == "white-rect"]
    errors = [r for r in results if r.kind == "error"]

    with args.list.open("w") as f:
        for r in sorted(flagged, key=lambda r: r.new_canvas):
            f.write(f"{r.code},{r.new_canvas}x{r.new_canvas}\n")

    with args.report.open("w") as f:
        f.write("code,canvas,bbox_long,fill_pct,kind,new_canvas,note\n")
        for r in sorted(results, key=lambda r: (r.new_canvas == 0, r.bbox_long)):
            fill = f"{r.bbox_long / r.canvas:.2f}" if r.canvas else ""
            f.write(f"{r.code},{r.canvas},{r.bbox_long},{fill},"
                    f"{r.kind},{r.new_canvas},{r.note}\n")

    print(f"\nFlagged for re-download: {len(flagged)} / {len(results)}")
    print(f"  pure-alpha (gap added): {len(flagged) - len(white)}")
    print(f"  white-rectangle:        {len(white)}")
    print(f"  left alone:             {len(results) - len(flagged) - len(errors)}")
    print(f"  errors:                 {len(errors)}")
    print(f"\nWrote list   -> {args.list}")
    print(f"Wrote report -> {args.report}")
    if errors:
        print("\nErrors:")
        for r in errors[:10]:
            print(f"  {r.code}: {r.note}")


if __name__ == "__main__":
    main()
