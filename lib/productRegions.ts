const REGION_PREFERENCE = ["ZM", "LL"];

const KEYBOARD_LANGUAGE_NAMES: Record<string, string> = {
  AB: "Arabic",
  AM: "US English",
  B: "British English",
  D: "German",
  DK: "Danish",
  E: "Spanish (Spain)",
  EQ: "Chinese (Zhuyin)",
  F: "French",
  J: "Japanese",
  KU: "Korean",
  LA: "Spanish (Latin America)",
  LC: "Chinese (Pinyin)",
  LL: "US English",
  PO: "Portuguese",
  RS: "Russian",
  SM: "Swiss",
  SF: "Swiss",
  T: "Italian",
  UA: "Ukrainian",
};

const normalizeRegionCode = (value: string | undefined): string =>
  String(value || "")
    .trim()
    .replace(/\/A$/i, "")
    .toUpperCase();

export function parseRegionCodes(
  value: string | string[] | null | undefined,
): string[] {
  const values = Array.isArray(value)
    ? value
    : String(value || "").split(/\s+/);
  return [...new Set(values.map(normalizeRegionCode).filter(Boolean))];
}

export function getPreferredRegion(
  value: string | string[] | null | undefined,
): string {
  const regions = parseRegionCodes(value);
  return (
    REGION_PREFERENCE.find((preferred) => regions.includes(preferred)) ||
    regions[0] ||
    ""
  );
}

export function formatOrderNumber(sku: string, region?: string): string {
  const normalizedSku = String(sku || "").trim();
  const normalizedRegion = normalizeRegionCode(region);
  return normalizedRegion
    ? `${normalizedSku}${normalizedRegion}/A`
    : normalizedSku;
}

export function getKeyboardLanguageName(region: string): string {
  const normalizedRegion = normalizeRegionCode(region);
  return KEYBOARD_LANGUAGE_NAMES[normalizedRegion] || normalizedRegion;
}

export function isKeyboardProduct(kind: string): boolean {
  return /keyboard/i.test(String(kind || ""));
}

// Price formatting grew a full currency table and lives with it now.
export { formatPrice } from "./currencies";
