import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// The catalogue is split across four CSVs that all key off the primary SKU:
//   database.csv — core attributes (regions, kind, colour, model, …)
//   msrp.csv     — SKU, USD, EUR, GBP, JPY
//   edu.csv      — SKU, USD (only SKUs that carry an education price)
//   alt.csv      — SKU, regions, alt_sku, alt_release_date (only re-releases)
//   similarities.csv — group_id, SKUs... (read separately as a compact relationship map)
// We left-join them here and hand back records in the original flat shape
// (MSRP / MSRP_EUR / MSRP_GBP / edu_price / alt_sku / alt_release_date) so the
// rest of the app doesn't need to know the data was normalised.

/**
 * One joined catalogue row. Every field is a trimmed (possibly empty) string —
 * this module is the single place where CSV whitespace is normalised, so
 * consumers can compare fields directly.
 */
export interface CaseRecord {
  SKU: string;
  regions: string;
  kind: string;
  colour: string;
  model: string;
  season: string;
  release_date: string;
  alt_thumbnail: string;
  name: string;
  MSRP: string;
  MSRP_EUR: string;
  MSRP_GBP: string;
  edu_price: string;
  alt_sku: string;
  alt_release_date: string;
}

const DATABASE_DIR = path.join(process.cwd(), "database");

function readTable(file: string): Record<string, string>[] {
  const csvData = fs.readFileSync(path.join(DATABASE_DIR, file), "utf-8");
  const rows: Record<string, string>[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });
  return rows.map((row) => {
    const trimmed: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) trimmed[key] = value.trim();
    return trimmed;
  });
}

// Builds a SKU-keyed lookup from a table, projecting each row with `project`.
function indexBySku<T>(
  file: string,
  project: (row: Record<string, string>) => T,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of readTable(file)) {
    const sku = row.SKU ?? "";
    if (sku && !map.has(sku)) map.set(sku, project(row));
  }
  return map;
}

let cachedCases: CaseRecord[] | undefined;

export function getAllCasesFromCSV(): CaseRecord[] {
  if (cachedCases) return cachedCases;

  const msrp = indexBySku("msrp.csv", (r) => ({
    MSRP: r.USD,
    MSRP_EUR: r.EUR,
    MSRP_GBP: r.GBP,
  }));
  const edu = indexBySku("edu.csv", (r) => r.USD);
  const alt = indexBySku("alt.csv", (r) => ({
    alt_sku: r.alt_sku,
    alt_release_date: r.alt_release_date,
  }));

  cachedCases = readTable("database.csv").map((record) => {
    const sku = record.SKU ?? "";
    return {
      ...record,
      MSRP: "",
      MSRP_EUR: "",
      MSRP_GBP: "",
      edu_price: edu.get(sku) ?? "",
      alt_sku: "",
      alt_release_date: "",
      ...msrp.get(sku),
      ...alt.get(sku),
    } as CaseRecord;
  });

  return cachedCases;
}

export interface CaseFilters {
  model?: string | string[] | null;
  material?: string | null;
  season?: string | null;
}

export function filterCases(
  records: CaseRecord[],
  { model = null, material = null, season = null }: CaseFilters = {},
): CaseRecord[] {
  return records.filter((record) => {
    const matchesModel = model
      ? Array.isArray(model)
        ? model.some((entry) => record.model === entry.trim())
        : record.model === model.trim()
      : true;
    const matchesMaterial = material
      ? record.kind.toLowerCase().includes(material.trim().toLowerCase())
      : true;
    const matchesSeason = season
      ? record.season.toLowerCase().includes(season.trim().toLowerCase())
      : true;
    return matchesModel && matchesMaterial && matchesSeason;
  });
}
