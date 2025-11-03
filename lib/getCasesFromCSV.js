import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export function getAllCasesFromCSV() {
  const csvPath = path.join(process.cwd(), 'scripts', 'output.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvData, { columns: true, skip_empty_lines: true });
  return records;
}

export function filterCases(records, { model = null, material = null, season = null } = {}) {
  return records.filter((record) => {
    const matchesModel = model ? record.model === model.trim() : true;
    const matchesMaterial = material
      ? record.kind.toLowerCase().includes(material.trim().toLowerCase())
      : true;
    const matchesSeason = season
      ? record.season.toLowerCase().includes(season.trim().toLowerCase())
      : true;
    return matchesModel && matchesMaterial && matchesSeason;
  });
}
