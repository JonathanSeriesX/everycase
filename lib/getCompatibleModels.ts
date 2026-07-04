import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const MODELS_PATH = path.join(process.cwd(), "database", "models.csv");

let cachedCompatibility: Map<string, string[]> | undefined;

function loadCompatibility(): Map<string, string[]> {
  if (cachedCompatibility) return cachedCompatibility;

  const csvData = fs.readFileSync(MODELS_PATH, "utf-8");
  const rows: Record<string, string>[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  cachedCompatibility = new Map();
  for (const row of rows) {
    const model = (row.model || "").trim();
    if (!model || cachedCompatibility.has(model)) continue;

    const compatibleModels = Object.entries(row)
      .filter(([column]) => column.startsWith("compatible_model_"))
      .map(([, value]) => (value || "").trim())
      .filter(Boolean);

    cachedCompatibility.set(model, compatibleModels);
  }

  return cachedCompatibility;
}

export function getCompatibleModels(model: string): string[] {
  return loadCompatibility().get((model || "").trim()) ?? [];
}
