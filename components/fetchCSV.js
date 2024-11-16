import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export const fetchCSV = (fileName) => {
  try {
    const csvPath = path.join(process.cwd(), fileName);
    const csvData = fs.readFileSync(csvPath, "utf-8");

    // Parse CSV data into objects
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });

    return records;
  } catch (error) {
    console.error(`[readCsvFile] Error reading ${fileName}:`, error);
    throw error;
  }
};