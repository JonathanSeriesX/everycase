# everycase asset pipeline

One tool — `assets.py` — manages the whole image lifecycle. Run any command
with the project venv:

```bash
cd scripts
.venv/bin/python assets.py <command>      # rebuild venv: uv venv .venv && uv pip install -r requirements.txt
```

## Sources of truth

| What | Where | Authoritative for |
|------|-------|-------------------|
| Images | `/Volumes/Storage/Images/1_final-sources/*.png` | the actual pixels (crops + any manual work live here) |
| Models | `database.csv` | the case catalog (SKU, colour, model, season, price, name) |
| **Index** | `variants.csv` | **derived** — never hand-authoritative |

`variants.csv` is a generated join of "files on the drive" × "models in the
catalog". The website reads it. Regenerate it any time with `assets.py index`.

Some cases are catalogued in `content/**.mdx` instead of `database.csv`
(iPod touch loops, Pencil cases) — `index` notes these as `MDX-catalogued?`.

## variants.csv columns

```
code, sku, download_res, crop, note
```

- `download_res` — resolution fetched from Apple (blank ⇒ 4608×4608). Varies
  both directions: old products are small (768–1280), a few are larger (6816).
- `crop` — named spec from `crop_specs.csv` (blank ⇒ no crop).
- `note` — provenance; `verify` marks rows worth a human glance.

## Forward intake

New images don't exist on the drive yet, so they can't be in `variants.csv`.
Queue them in `list.txt` (`code,download_res[,crop]`); `fetch` pulls them in.

## Commands

| Command | Replaces | Does |
|---------|----------|------|
| `discover apple.json [--append-intake]` | manual sitemap reading | List SKUs (with title + price) in an Apple category JSON not yet in `database.csv` |
| `fetch` | `2_image_downloader.py` + hand-built `list.txt` | Download intake codes into `1_final-sources` (skips existing) |
| `transform [--dry-run]` | `batch_cropper.py` | Apply `crop_specs.csv` crops into `crop_town`; review, then move approved crops into `1_final-sources` |
| `build` | `3_compress.sh` | Compress `1_final-sources` → AVIF 512 + WebP 2048 previews |
| `sync` | `4_rclone.sh` | rclone previews/sources to R2, then re-`index` |
| `index` | hand-edited `source_images.txt` | Regenerate `variants.csv` from the drive |
| `all` | running 2→3→4 by hand | `fetch → transform → build → sync` |

All paths and the R2 remote live in one `CONFIG` block at the top of
`assets.py`; `3_compress.sh` / `4_rclone.sh` read them from the environment.

## Typical run (adding new cases)

```bash
.venv/bin/python assets.py discover ~/Downloads/category.json --append-intake
# edit list.txt: keep Apple (M*) codes, add _AVnn variants + crop labels
# add the new rows to database.csv (discover prints title + price)
.venv/bin/python assets.py fetch
.venv/bin/python assets.py transform        # then move crop_town/* into 1_final-sources
.venv/bin/python assets.py build
.venv/bin/python assets.py sync             # uploads + re-indexes variants.csv
```

## Not part of the image pipeline

`price_list_puller.py`, `pdf_processor.py` (Apple education price lists),
`og-image.js` / `generate_og_images.py` (social preview images).
