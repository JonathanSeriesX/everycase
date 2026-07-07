"""Re-centre off-centre DEVICE renders — losslessly, into download/ only.

Reads centering_report.csv (from 6_measure_centering.py), flags every
kind==alpha row whose off_max_frac >= --threshold, then for each:

  1. copies the ORIGINAL from 1_final-sources -> download/   (untouched source stays put)
  2. re-centres the download/ copy IN PLACE: trims to the content bounding box
     and re-pads it with transparent alpha equally on all sides back to the
     original canvas size.

Because canvas >= bbox on every axis, centring only ever ADDS/REDISTRIBUTES
transparent padding — it never crops content, and the content pixels are copied
verbatim (no resampling). White-background (kind==white) rows are skipped.

Nothing is written back to 1_final-sources. Also writes a manifest and a
before/after review montage per image into download/_review/.
"""

import argparse
import csv
import shutil
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = Path("/Volumes/Storage/Images/1_final-sources")
DEFAULT_DEST = Path("/Volumes/Storage/Images/download")
DEFAULT_REPORT = Path(__file__).resolve().parent / "centering_report.csv"


def run(args):
    r = subprocess.run(["magick", *args], capture_output=True, text=True, timeout=180)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip()[:200])
    return r.stdout.strip()


def bbox(path):
    trim = run([str(path), "-format", "%@", "info:"])
    bw, rest = trim.split("x", 1)
    bh, x, y = rest.replace("+", " ").split()
    return int(bw), int(bh), int(x), int(y)


def recenter_in_place(path, w, h, axis="y"):
    """Re-centre the content bbox on the chosen axis/axes, keeping the other
    axis at its original position. Content pixels are copied verbatim onto a
    fresh transparent canvas (no resampling).

      axis="y"     centre vertically only  (fix the droop, keep X composition)
      axis="x"     centre horizontally only
      axis="both"  centre on both axes
    """
    bw, bh, x, y = bbox(path)
    nx = x if axis == "y" else (w - bw) // 2
    ny = y if axis == "x" else (h - bh) // 2
    run(["-size", f"{w}x{h}", "xc:none",
         "(", str(path), "-background", "none", "-trim", "+repage", ")",
         "-geometry", f"+{nx}+{ny}", "-compose", "over", "-composite",
         "+repage", str(path)])


def verify_lossless(original, recentered):
    """Trimmed content of both must be pixel-identical (0 abs error)."""
    out = subprocess.run(
        ["magick", "compare", "-metric", "AE",
         "(", str(original), "-trim", "+repage", ")",
         "(", str(recentered), "-trim", "+repage", ")",
         "null:"],
        capture_output=True, text=True, timeout=180)
    return out.stderr.strip()  # AE count as string, "0" == identical


def montage(original, recentered, out_png, w, h):
    """Side-by-side before|after, downscaled, with a centre crosshair."""
    line = "xc:none -fill none -stroke red -strokewidth 3"
    run([
        "(", str(original), "-resize", "400x400", "-background", "gray90",
        "-flatten", "-gravity", "center",
        "-draw", "stroke red stroke-width 1 line 0,200 400,200",
        "-draw", "stroke red stroke-width 1 line 200,0 200,400", ")",
        "(", str(recentered), "-resize", "400x400", "-background", "gray90",
        "-flatten", "-gravity", "center",
        "-draw", "stroke red stroke-width 1 line 0,200 400,200",
        "-draw", "stroke red stroke-width 1 line 200,0 200,400", ")",
        "+append", str(out_png)])


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--threshold", type=float, default=0.04,
                    help="flag rows with off_max_frac >= this (default 0.04)")
    ap.add_argument("--axis", choices=["y", "x", "both"], default="y",
                    help="which axis to re-centre (default y: fix vertical droop only)")
    ap.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    ap.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    ap.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    ap.add_argument("--montage", action="store_true", help="write review montages")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    rows = [r for r in csv.DictReader(args.report.open())
            if r["kind"] == "alpha" and float(r["off_max_frac"]) >= args.threshold]
    print(f"{len(rows)} images flagged (alpha, off_max_frac >= {args.threshold})")
    if args.dry_run:
        for r in rows:
            print(f"  {r['off_max_frac']}  {r['file']}")
        return

    review = args.dest / "_review"
    review.mkdir(parents=True, exist_ok=True)
    manifest = []
    bad = []

    for i, r in enumerate(rows, 1):
        src = args.source / r["file"]
        dst = args.dest / r["file"]
        w, h = int(r["canvas_w"]), int(r["canvas_h"])
        shutil.copy2(src, dst)
        recenter_in_place(dst, w, h, args.axis)

        ae = verify_lossless(src, dst)
        bw, bh, x, y = bbox(dst)
        new_off_x = round((x + bw / 2 - w / 2) / w, 4)
        new_off_y = round((y + bh / 2 - h / 2) / h, 4)
        if args.montage:
            montage(src, dst, review / f"{Path(r['file']).stem}.png", w, h)

        ok = ae.split()[0] in ("0", "0.0")
        if not ok:
            bad.append((r["file"], ae))
        manifest.append({
            "file": r["file"], "canvas": f"{w}x{h}",
            "old_off_y": r["off_y_frac"], "new_off_y": new_off_y,
            "old_off_x": r["off_x_frac"], "new_off_x": new_off_x,
            "lossless_AE": ae,
        })
        print(f"  [{i}/{len(rows)}] {r['file']}  "
              f"y {float(r['off_y_frac']):+.3f}->{new_off_y:+.3f}  AE={ae}")

    with (args.dest / "centering_manifest.csv").open("w", newline="") as f:
        wr = csv.DictWriter(f, fieldnames=list(manifest[0].keys()))
        wr.writeheader()
        wr.writerows(manifest)

    print(f"\nDone. {len(manifest)} recentred into {args.dest}")
    print(f"Manifest -> {args.dest / 'centering_manifest.csv'}")
    if args.montage:
        print(f"Review montages -> {review}")
    if bad:
        print(f"\nWARNING: {len(bad)} not pixel-lossless:")
        for f, ae in bad:
            print(f"  {f}: AE={ae}")
    else:
        print("All recentred images verified pixel-lossless (content AE=0).")


if __name__ == "__main__":
    main()
