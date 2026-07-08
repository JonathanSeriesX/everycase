import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// images.csv is the manifest of every image asset, in gallery (source) order.
// It replaces the old flat source_images.txt: each row still keys off the
// asset filename, but now carries the square resolution, the colour of the
// device inside the case, whether the image has an opaque (non-transparent)
// background, and a `hidden` flag that keeps an asset out of case-page
// galleries (e.g. the `_cut` Leather Sleeve close-ups, used only as thumbnails).

export interface ImageRecord {
  filename: string;
  /** Square dimension in px; 0 when unknown. */
  res: number;
  /** Excluded from case-page galleries when true. */
  hidden: boolean;
  /** Colour of the device shown inside the case; "" when unknown. */
  colour: string;
  /** Opaque background (no alpha to composite against) when true. */
  nonTransparent: boolean;
}

const IMAGES_PATH = path.join(process.cwd(), "database", "images.csv");

const toInt = (value: string | undefined): number => {
  const n = Number.parseInt((value || "").trim(), 10);
  return Number.isFinite(n) ? n : 0;
};

const toBool = (value: string | undefined): boolean => {
  const s = (value || "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
};

let cachedImages: ImageRecord[] | undefined;
let cachedVisibleFilenames: string[] | undefined;
let cachedResByFilename: Map<string, number> | undefined;
let cachedImagesBySku: Map<string, ImageRecord[]> | undefined;

/** Every image row, in images.csv (gallery) order. */
export function getAllImages(): ImageRecord[] {
  if (cachedImages) return cachedImages;

  let rows: Record<string, string>[] = [];
  try {
    const csvData = fs.readFileSync(IMAGES_PATH, "utf-8");
    rows = parse(csvData, { columns: true, skip_empty_lines: true });
  } catch {
    rows = [];
  }

  cachedImages = rows
    .map((row) => ({
      filename: (row.filename || "").trim(),
      res: toInt(row.res),
      hidden: toBool(row.hidden),
      colour: (row.colour || "").trim(),
      nonTransparent: toBool(row.non_transparent),
    }))
    .filter((record) => record.filename);

  return cachedImages;
}

/**
 * Filenames that may appear in a case-page gallery, in source order. Hidden
 * rows (e.g. `_cut` thumbnails) are dropped; SKU/region matching happens on
 * top of this list, exactly as it did against source_images.txt.
 */
export function getVisibleImageFilenames(): string[] {
  cachedVisibleFilenames ??= getAllImages()
    .filter((record) => !record.hidden)
    .map((record) => record.filename);
  return cachedVisibleFilenames;
}

/**
 * The image filename whose pictured device colour matches `colour` for a given
 * case SKU — e.g. the `MH004` photo showing a Light Gold iPhone Air. Lets the
 * collection page swap a case's thumbnail to match the owned device's colour.
 * Returns null when the SKU has no colour-tagged image for that colour (the
 * caller should fall back to its default thumbnail). Filenames key to a SKU by
 * their pre-underscore prefix (`MH004`, `MH004_AV1`); colour is matched exactly
 * against the device finish names in devices.csv (both are trimmed on load).
 */
export function imageForColour(sku: string, colour: string): string | null {
  if (!sku || !colour) return null;
  if (!cachedImagesBySku) {
    cachedImagesBySku = new Map();
    for (const record of getAllImages()) {
      const key = record.filename.split("_")[0];
      let list = cachedImagesBySku.get(key);
      if (!list) cachedImagesBySku.set(key, (list = []));
      list.push(record);
    }
  }
  const match = cachedImagesBySku
    .get(sku)
    ?.find((record) => !record.hidden && record.colour === colour);
  return match?.filename ?? null;
}

/** The asset's square resolution in px; 0 when unknown. */
export function getImageRes(filename: string): number {
  cachedResByFilename ??= new Map(
    getAllImages().map((record) => [record.filename, record.res]),
  );
  return cachedResByFilename.get(filename) ?? 0;
}
