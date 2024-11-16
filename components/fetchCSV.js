import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

/**
 * Fetches phone cases from a local CSV file, filtering by optional criteria.
 * Kind of like fetchSupabase, but not a hook, so can be used during build time
 *
 * @param {string|null} [model] - The model of the phone to filter by (e.g., "iPhone 14"), or `null` for all.
 * @param {string|null} [material] - The material of the case to filter by (e.g., "Leather"), or `null` for all.
 * @param {string|null} [season] - The season to filter by (e.g., "Winter"), or `null` for all.
 * @returns {Array<Object>} - An array of matching phone cases.
 */
export const useFetchCases = (model = null, material = null, season = null) => {
  try {
    const csvPath = path.join(process.cwd(), "scripts", "skus.csv"); // Hardcoded path
    const csvData = fs.readFileSync(csvPath, "utf-8");

    // Parse CSV data into objects
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    // Apply filters if provided
    const filteredRecords = records.filter((record) => {
      const matchesModel = model ? record.model === model.trim() : true;
      const matchesMaterial = material
        ? record.kind.toLowerCase().includes(material.trim().toLowerCase())
        : true;
      const matchesSeason = season
        ? record.season.toLowerCase().includes(season.trim().toLowerCase())
        : true;

      return matchesModel && matchesMaterial && matchesSeason;
    });

    return filteredRecords;
  } catch (error) {
    console.error(`[fetchCSV] Error reading or processing CSV:`, error);
    return [];
  }
};
