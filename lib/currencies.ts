// All price columns in database/msrp.csv, in column order. USD is the
// baseline shown everywhere; the others are selectable in the footer menu.
export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "CAD",
  "AUD",
  "INR",
  "KRW",
  "BRL",
  "MXN",
  "CHF",
  "SGD",
  "HKD",
  "AED",
  "SEK",
] as const;

export type Currency = (typeof CURRENCIES)[number];

/** What the pills show alongside USD until the reader picks a currency. */
export const DEFAULT_SECONDARY_CURRENCY: Currency = "EUR";

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  INR: "Indian Rupee",
  KRW: "South Korean Won",
  BRL: "Brazilian Real",
  MXN: "Mexican Peso",
  CHF: "Swiss Franc",
  SGD: "Singapore Dollar",
  HKD: "Hong Kong Dollar",
  AED: "UAE Dirham",
  SEK: "Swedish Krona",
};

// [prefix, suffix] per currency. Dollar/yen signs are disambiguated (CA$,
// CN¥, …) because a second pill always sits next to the plain-$ USD one.
const AFFIXES: Record<Currency, [string, string]> = {
  USD: ["$", ""],
  EUR: ["€", ""],
  GBP: ["£", ""],
  JPY: ["¥", ""],
  CNY: ["CN¥", ""],
  CAD: ["CA$", ""],
  AUD: ["A$", ""],
  INR: ["₹", ""],
  KRW: ["₩", ""],
  BRL: ["R$", ""],
  MXN: ["MX$", ""],
  CHF: ["CHF ", ""],
  SGD: ["S$", ""],
  HKD: ["HK$", ""],
  AED: ["AED ", ""],
  SEK: ["", " kr"],
};

// Prices in the catalogue are bare amounts like "49" or "7980". Keep parsing
// numeric so legacy decimal values still work, retain cents only when they
// are non-zero, and group thousands (₩49,000) with a fixed locale so server
// and client render identically.
export function formatPrice(
  value: string | number | null | undefined,
  currency: string = "USD",
): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return "";
  const affix = AFFIXES[currency as Currency];
  if (!affix) return "";
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
  return `${affix[0]}${formatted}${affix[1]}`;
}
