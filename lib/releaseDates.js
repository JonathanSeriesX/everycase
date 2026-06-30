import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

let cachedReleaseDates;

// Release dates live in the primary catalog. Alternative SKUs have a separate
// date so re-releases remain available without loading the legacy archive.
function loadReleaseDates() {
  if (cachedReleaseDates) return cachedReleaseDates;

  cachedReleaseDates = new Map();
  try {
    const csvPath = path.join(process.cwd(), "scripts", "database.csv");
    const records = parse(fs.readFileSync(csvPath, "utf-8"), {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    for (const record of records) {
      const sku = (record.SKU || "").trim();
      const date = (record.release_date || "").trim();
      if (sku && date && !cachedReleaseDates.has(sku)) {
        cachedReleaseDates.set(sku, date);
      }

      const altSku = (record.alt_sku || "").trim();
      const altDate = (record.alt_release_date || "").trim();
      if (altSku && altDate && !cachedReleaseDates.has(altSku)) {
        cachedReleaseDates.set(altSku, altDate);
      }
    }
  } catch {
    // Missing catalog just means no release dates — pages render without them.
  }

  return cachedReleaseDates;
}

// Catalog dates are M/D/YY (e.g. "9/12/23"). Turn that into "September 12, 2023".
function formatRawDate(raw) {
  const match = String(raw || "")
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return "";

  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function getReleaseDate(sku) {
  const raw = loadReleaseDates().get(String(sku || "").trim());
  return raw ? formatRawDate(raw) : "";
}
