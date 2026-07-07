const REGION_PREFERENCE = ["ZM", "LL"];

const KEYBOARD_LANGUAGE_NAMES: Record<string, string> = {
  AB: "Arabic",
  AM: "US English",
  B: "British English",
  BG: "Bulgarian",
  C: "French (Canada)",
  CH: "Chinese (Pinyin)",
  CR: "Croatian",
  CZ: "Czech",
  D: "German",
  DK: "Danish",
  // 2016-era code: sold as "Español" in Mexico while Y covered Spain;
  // modern rows pair E with LA instead, so keep the label era-neutral.
  E: "Spanish",
  EQ: "Chinese (Zhuyin)",
  F: "French",
  GR: "Greek",
  H: "Norwegian",
  HB: "Hebrew",
  J: "Japanese",
  KH: "Korean",
  KU: "Korean",
  LA: "Spanish (Latin America)",
  // LB/ZA are regional part variants of the US English layout, not layouts.
  LB: "US English (Middle East)",
  LC: "Chinese (Pinyin)",
  LL: "US English",
  MG: "Hungarian",
  N: "Dutch",
  PO: "Portuguese",
  RO: "Romanian",
  RS: "Russian",
  S: "Swedish",
  SL: "Slovak",
  SM: "Swiss",
  SF: "Swiss",
  T: "Italian",
  TA: "Chinese (Zhuyin)",
  TH: "Thai",
  TQ: "Turkish (Q)",
  TU: "Turkish (F)",
  UA: "Ukrainian",
  Y: "Spanish (Spain)",
  ZA: "US English (Southeast Asia)",
  ZM: "International English",
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
