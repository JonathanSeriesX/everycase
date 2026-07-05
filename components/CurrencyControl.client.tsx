"use client";

import DropdownMenu from "./DropdownMenu.client";
import { CURRENCIES, CURRENCY_NAMES, type Currency } from "../lib/currencies";
import { setCurrency, useCurrency } from "../lib/useCurrency";

// USD is pinned as the first price pill everywhere, so this picks only the
// secondary currency — alphabetically by code.
const OPTIONS = CURRENCIES.filter((code) => code !== "USD")
  .slice()
  .sort();

/** Currency picker on the settings page. */
export default function CurrencyControl() {
  const currency = useCurrency();

  return (
    <DropdownMenu
      ariaLabel="Secondary currency"
      value={currency}
      options={OPTIONS.map((code) => ({
        value: code,
        label: `${code} · ${CURRENCY_NAMES[code]}`,
      }))}
      onSelect={(next) => setCurrency(next as Currency)}
      buttonContent={`${currency} · ${CURRENCY_NAMES[currency]}`}
      scrollable
    />
  );
}
