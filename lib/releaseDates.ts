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

let cachedReleaseDates: Map<string, string> | undefined;

function readCsv(file: string): Record<string, string>[] {
  const csvPath = path.join(process.cwd(), "scripts", file);
  return parse(fs.readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });
}

// Primary release dates live in database.csv; re-release dates live alongside
// their alt SKU in alt.csv, so re-releases stay resolvable on their own URL.
function loadReleaseDates(): Map<string, string> {
  if (cachedReleaseDates) return cachedReleaseDates;

  cachedReleaseDates = new Map();
  try {
    for (const record of readCsv("database.csv")) {
      const sku = (record.SKU || "").trim();
      const date = (record.release_date || "").trim();
      if (sku && date && !cachedReleaseDates.has(sku)) {
        cachedReleaseDates.set(sku, date);
      }
    }

    for (const record of readCsv("alt.csv")) {
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
function formatRawDate(raw: string): string {
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

export function getReleaseDate(sku: string): string {
  const raw = loadReleaseDates().get(String(sku || "").trim());
  return raw ? formatRawDate(raw) : "";
}
