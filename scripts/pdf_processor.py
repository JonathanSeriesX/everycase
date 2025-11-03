#!/usr/bin/env python3
"""
Folder-wide Apple price table extractor → single CSV with exactly 4 columns:
  SKU, Name, Date, Price

Rules:
- Only include SKUs that START WITH 'M' (case-insensitive) and are 5 chars (e.g., MRMF3).
- Date is STRICT American mm/dd/yy (e.g., 12/2/24). Row date preferred, else page date.
- Price normalized to two decimals, no currency symbols.
- Process EVERY .pdf in an input directory (non-recursive by default; flip to rglob if you want).
- De-duplicate IDENTICAL table blocks across strategies/files (by a table signature).
- Treat SKU as the unique key: keep one row per SKU. If the same SKU appears multiple times,
  choose the best Name and the newest Date; carry the Price tied to that newest Date.

Deps:
  pip install pdfplumber pandas
Usage:
  python extract_dir_pdf_tables.py /path/to/folder output.csv
"""

import sys
import re
from pathlib import Path
from datetime import datetime
import pdfplumber
import pandas as pd

# Strict mm/dd/yy date like 12/2/24
DATE_RE = re.compile(r"\b(0?[1-9]|1[0-2])/(0?[1-9]|[12][0-9]|3[01])/\d{2}\b")

# Apple part numbers like MPHE3LL/A -> capture first 5 alphanumerics; ignore region suffix.
SKU_RE = re.compile(r"\b([A-Z0-9]{5})(?:\s*[A-Z]{1,3}/A)?\b", re.IGNORECASE)

# Prices like $1,234.56 or 1234.56
PRICE_RE = re.compile(
    r"(?<!\w)(?:USD\s*|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))"
)

HEADER_HINTS = ("part", "description", "sku", "price", "pricing", "date")

def norm_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def looks_like_header(cells: list[str]) -> bool:
    joined = " ".join(c.lower() for c in cells if c)
    return any(k in joined for k in HEADER_HINTS)

def parse_mmddyy_to_date(s: str):
    try:
        return datetime.strptime(s, "%m/%d/%y").date()
    except Exception:
        return None

def find_page_date_text(page) -> str | None:
    text = page.extract_text() or ""
    m = DATE_RE.search(text)
    return m.group(0) if m else None

def extract_tables(page):
    """Return list of tables (each table is list[list[str]]). Try lines, then text."""
    tables = []
    strategies = [
        dict(vertical_strategy="lines", horizontal_strategy="lines", snap_tolerance=3, join_tolerance=3),
        dict(vertical_strategy="text", horizontal_strategy="text"),
    ]
    for ts in strategies:
        try:
            tlist = page.extract_tables(table_settings=ts) or []
        except Exception:
            tlist = []
        for t in tlist:
            rows = []
            for r in t:
                cells = [norm_ws(c) if isinstance(c, str) else "" for c in r]
                if any(cells):
                    rows.append(cells)
            if rows:
                tables.append(rows)
    # keep both; we'll de-dupe by signature at the run level
    return tables

def pick_name_from_cells(cells: list[str], sku: str, date_txt: str | None, price_txt: str | None) -> str:
    badbits = [sku or ""]
    if date_txt: badbits.append(date_txt)
    if price_txt: badbits.append(price_txt)

    candidates = []
    for c in cells:
        if not c:
            continue
        x = c
        for b in badbits:
            if b and b.lower() in x.lower():
                x = re.sub(re.escape(b), " ", x, flags=re.IGNORECASE)
        x = norm_ws(x)
        if x:
            candidates.append(x)
    if not candidates:
        return ""

    def score(s: str):
        letters = len(re.findall(r"[A-Za-z]", s))
        digits  = len(re.findall(r"\d", s))
        words   = len(s.split())
        return (letters * 3) - (digits * 2) + words * 1.5 + len(s) * 0.05

    best = max(candidates, key=score)
    # Demote obvious fragments
    if len(best) < 20 and len(best.split()) < 4:
        best = max(candidates, key=lambda s: len(s))
    return best

def extract_row(cells: list[str], page_date: str | None):
    if looks_like_header(cells):
        return None

    # SKU
    sku = None
    for c in cells:
        m = SKU_RE.search(c)
        if m:
            sku = m.group(1).upper()
            break
    if not sku:
        return None

    # Only M-prefix SKUs
    if not sku.startswith("M"):
        return None

    # Date (row first, else page), must match mm/dd/yy
    row_date_txt = None
    for c in cells:
        m = DATE_RE.search(c)
        if m:
            row_date_txt = m.group(0)
            break
    date_txt = row_date_txt or page_date
    if not date_txt:
        return None
    date_obj = parse_mmddyy_to_date(date_txt)
    if not date_obj:
        return None

    # Price: last match on the row
    price = None
    for c in cells:
        matches = list(PRICE_RE.finditer(c))
        if matches:
            price = matches[-1].group(1)
    if not price:
        return None
    price = price.replace(",", "")
    try:
        price = f"{float(price):.2f}"
    except Exception:
        return None

    # Name
    name = pick_name_from_cells(cells, sku, date_txt, price)
    if not name:
        return None

    return {"SKU": sku, "Name": name, "Date": date_txt, "DateObj": date_obj, "Price": price}

def name_quality(s: str) -> float:
    letters = len(re.findall(r"[A-Za-z]", s))
    digits  = len(re.findall(r"\d", s))
    words   = len(s.split())
    return (letters * 3) - (digits * 0.5) + words * 2 + len(s) * 0.05

def choose_better_name(old: str, new: str) -> str:
    if not old:
        return new
    if not new:
        return old
    if old.lower() in new.lower() and len(new) > len(old):
        return new
    if new.lower() in old.lower() and len(old) >= len(new):
        return old
    return new if name_quality(new) > name_quality(old) else old

def run_dir(in_dir: Path, out_csv: Path):
    # global de-dup for tables across files/strategies
    seen_table_sigs = set()

    # SKU -> best record
    by_sku = {}

    # non-recursive; change to rglob("*.pdf") if you want recursion
    pdf_files = sorted(p for p in in_dir.glob("*.pdf") if p.is_file())

    for pdf_path in pdf_files:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_date = find_page_date_text(page)
                tables = extract_tables(page)
                for tbl in tables:
                    # signature: first 3 rows content as tuple of tuples
                    sig = tuple(tuple(r) for r in tbl[:3])
                    if sig in seen_table_sigs:
                        continue
                    seen_table_sigs.add(sig)

                    width = max(len(r) for r in tbl)
                    for r in tbl:
                        r = r + [""] * (width - len(r))
                        row = extract_row(r, page_date)
                        if not row:
                            continue

                        sku = row["SKU"]
                        # merge per-SKU: prefer newest Date; keep Name by quality
                        if sku not in by_sku:
                            by_sku[sku] = row
                        else:
                            current = by_sku[sku]
                            # update if this row is newer
                            if row["DateObj"] and (not current["DateObj"] or row["DateObj"] > current["DateObj"]):
                                current["Date"] = row["Date"]
                                current["DateObj"] = row["DateObj"]
                                current["Price"] = row["Price"]
                            # always keep the better name
                            current["Name"] = choose_better_name(current["Name"], row["Name"])

    # finalize
    final_rows = []
    for sku, rec in by_sku.items():
        final_rows.append({
            "SKU": sku,
            "Name": rec["Name"],
            "Date": rec["Date"],
            "Price": rec["Price"],
        })

    final_rows.sort(key=lambda r: (r["SKU"], r["Name"]))
    pd.DataFrame(final_rows, columns=["SKU", "Name", "Date", "Price"]).to_csv(out_csv, index=False)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extract_dir_pdf_tables.py /path/to/folder output.csv", file=sys.stderr)
        sys.exit(2)
    in_dir = Path(sys.argv[1])
    out_csv = Path(sys.argv[2])
    if not in_dir.is_dir():
        print(f"Not a directory: {in_dir}", file=sys.stderr)
        sys.exit(2)
    run_dir(in_dir, out_csv)
    print(f"Wrote {out_csv}")