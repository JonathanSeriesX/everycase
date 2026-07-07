"""Measure how off-centre each DEVICE render sits inside its (square) canvas.

Read-only. Walks every device image in 1_final-sources (base image_key from
database/devices.csv plus its _AV* alternate angles), measures the alpha
bounding box, and reports how far the content centroid is from the canvas
centre as a fraction of the canvas.

  off_y_frac > 0  => content sits BELOW centre (extra alpha on top)
  off_x_frac > 0  => content sits RIGHT of centre

Only writes a report CSV. Feed the flagged rows to 7_recenter_devices.py.
"""

import argparse
import csv
import subprocess
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, asdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEVICES_CSV = REPO / "database" / "devices.csv"
DEFAULT_SOURCE = Path("/Volumes/Storage/Images/1_final-sources")
DEFAULT_REPORT = Path(__file__).resolve().parent / "centering_report.csv"

WHITE_THRESHOLD = 250   # r,g,b all >= this counts as opaque white (no alpha gap)
CORNER_INSET = 8        # px inside the bbox corner to sample for classification


@dataclass
class Measure:
    code: str
    file: str
    canvas_w: int = 0
    canvas_h: int = 0
    bbox_w: int = 0
    bbox_h: int = 0
    x: int = 0
    y: int = 0
    off_x_frac: float = 0.0
    off_y_frac: float = 0.0
    off_max_frac: float = 0.0
    kind: str = ""          # alpha | white | empty | error
    note: str = ""


def _im(args):
    return subprocess.run(
        ["magick", *args], capture_output=True, text=True, timeout=120
    ).stdout.strip()


def _parse_pixel(px):
    inside = px[px.index("(") + 1:px.index(")")]
    parts = [p.strip() for p in inside.split(",")]
    r, g, b = (float(parts[i]) for i in range(3))
    a = float(parts[3]) if len(parts) > 3 else 1.0
    return r, g, b, a


def measure(path: Path) -> Measure:
    m = Measure(code=path.stem, file=path.name)
    try:
        w, h = (int(v) for v in _im([str(path), "-format", "%w %h", "info:"]).split())
        m.canvas_w, m.canvas_h = w, h

        trim = _im([str(path), "-format", "%@", "info:"])
        bw, rest = trim.split("x", 1)
        bh, xoff, yoff = rest.replace("+", " ").split()
        bw, bh, x, y = int(bw), int(bh), int(xoff), int(yoff)
        m.bbox_w, m.bbox_h, m.x, m.y = bw, bh, x, y

        if bw <= 0 or bh <= 0:
            m.kind = "empty"
            m.note = "no content found"
            return m

        # classify the corner just inside the bbox
        px = _im([str(path), "-format",
                  f"%[pixel:p{{{x + CORNER_INSET},{y + CORNER_INSET}}}]", "info:"])
        r, g, b, a = _parse_pixel(px)
        m.kind = "white" if (a > 0.5 and min(r, g, b) >= WHITE_THRESHOLD) else "alpha"

        cx, cy = x + bw / 2, y + bh / 2
        m.off_x_frac = round((cx - w / 2) / w, 4)
        m.off_y_frac = round((cy - h / 2) / h, 4)
        m.off_max_frac = round(max(abs(m.off_x_frac), abs(m.off_y_frac)), 4)
        return m
    except Exception as exc:  # noqa: BLE001
        m.kind = "error"
        m.note = str(exc)[:100]
        return m


def device_files(source: Path):
    keys = []
    seen = set()
    with DEVICES_CSV.open(newline="") as f:
        for row in csv.DictReader(f):
            k = (row.get("image_key") or "").strip()
            if k and k not in seen:
                seen.add(k)
                keys.append(k)

    files = []
    fseen = set()
    for k in keys:
        for p in [source / f"{k}.png", *sorted(source.glob(f"{k}_AV*.png"))]:
            if p.exists() and p not in fseen:
                fseen.add(p)
                files.append(p)
    return keys, files


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    ap.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    keys, files = device_files(args.source)
    print(f"{len(keys)} unique device image_keys -> {len(files)} PNGs in {args.source}")

    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(measure, files))

    results.sort(key=lambda m: m.off_max_frac, reverse=True)

    fields = list(asdict(results[0]).keys()) if results else []
    with args.report.open("w", newline="") as f:
        wr = csv.DictWriter(f, fieldnames=fields)
        wr.writeheader()
        for m in results:
            wr.writerow(asdict(m))

    alpha = [m for m in results if m.kind == "alpha"]
    print(f"\nWrote report -> {args.report}")
    print(f"  alpha: {len(alpha)}  white: {sum(m.kind=='white' for m in results)}  "
          f"empty: {sum(m.kind=='empty' for m in results)}  "
          f"error: {sum(m.kind=='error' for m in results)}")

    print("\noff_max_frac distribution (alpha only):")
    for lo, hi in [(0.10, 99), (0.07, 0.10), (0.05, 0.07),
                   (0.03, 0.05), (0.02, 0.03), (0.0, 0.02)]:
        n = sum(1 for m in alpha if lo <= m.off_max_frac < hi)
        print(f"  {lo:.2f}-{hi if hi<1 else '+':>4}: {n}")

    print("\nTop 25 most off-centre (alpha):")
    for m in alpha[:25]:
        print(f"  {m.off_max_frac:+.3f}  x={m.off_x_frac:+.3f} y={m.off_y_frac:+.3f}  {m.file}")


if __name__ == "__main__":
    main()
