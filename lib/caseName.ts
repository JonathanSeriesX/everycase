import type { CaseRecord } from "./getCasesFromCSV";

/** Display name for a case: the CSV name, or a synthesized one. */
export function getCaseName(data: CaseRecord): string {
  if (data.name) return data.name;

  const modelMatch = data.model.match(/iPhone\s+(\d+)/i);
  const isMagSafeModel = modelMatch && parseInt(modelMatch[1], 10) >= 12;
  const colourPart =
    data.colour && data.colour !== "Clear Case" ? ` — ${data.colour}` : "";
  const magSafePart = isMagSafeModel ? " with MagSafe" : "";
  return `${data.model} ${data.kind}${magSafePart}${colourPart}`.trim();
}
