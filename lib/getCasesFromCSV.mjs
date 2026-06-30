import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// The catalog is split across four CSVs that all key off the primary SKU:
//   database.csv — core attributes (regions, kind, colour, model, …)
//   msrp.csv     — SKU, USD, EUR, GBP
//   edu.csv      — SKU, USD (only SKUs that carry an education price)
//   alt.csv      — SKU, regions, alt_sku, alt_release_date (only re-releases)
// We left-join them here and hand back records in the original flat shape
// (MSRP / MSRP_EUR / MSRP_GBP / edu_price / alt_sku / alt_release_date) so the
// rest of the app doesn't need to know the data was normalised.
const SCRIPTS_DIR = path.join(process.cwd(), "scripts");

function readTable(file) {
  const csvPath = path.join(SCRIPTS_DIR, file);
  const csvData = fs.readFileSync(csvPath, "utf-8");
  return parse(csvData, { columns: true, skip_empty_lines: true });
}

// Builds a SKU-keyed lookup from a table, projecting each row with `project`.
function indexBySku(file, project) {
  const map = new Map();
  for (const row of readTable(file)) {
    const sku = (row.SKU || "").trim();
    if (sku && !map.has(sku)) map.set(sku, project(row));
  }
  return map;
}

let cachedCases;

export function getAllCasesFromCSV() {
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
    const sku = (record.SKU || "").trim();
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
    };
  });

  return cachedCases;
}

export function filterCases(
  records,
  {
    model = null,
    material = null,
    season = null,
    exactMaterial = false,
  } = {},
) {
  return records.filter((record) => {
    const matchesModel = model
      ? Array.isArray(model)
        ? model.some((entry) => record.model === entry.trim())
        : record.model === model.trim()
      : true;
    const matchesMaterial = material
      ? exactMaterial
        ? record.kind.toLowerCase() === material.trim().toLowerCase()
        : record.kind.toLowerCase().includes(material.trim().toLowerCase())
      : true;
    const matchesSeason = season
      ? record.season.toLowerCase().includes(season.trim().toLowerCase())
      : true;
    return matchesModel && matchesMaterial && matchesSeason;
  });
}
