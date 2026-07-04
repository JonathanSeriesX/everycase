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

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

// Prices in the catalogue are bare amounts like "49" or "329". Keep parsing
// numeric so legacy decimal values still work, and retain cents only when they
// are non-zero.
export function formatPrice(
  value: string | number | null | undefined,
  currency = "USD",
): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return "";
  const symbol = CURRENCY_SYMBOLS[currency];
  if (!symbol) return "";
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return `${symbol}${amount.toFixed(hasCents ? 2 : 0)}`;
}
