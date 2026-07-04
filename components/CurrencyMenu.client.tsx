"use client";

import DropdownMenu from "./DropdownMenu.client";
import { CURRENCIES, CURRENCY_NAMES, type Currency } from "../lib/currencies";
import { setCurrency, useCurrency } from "../lib/useCurrency";
import chrome from "../styles/Chrome.module.css";

// USD is pinned as the first price pill everywhere, so the menu offers only
// the secondary currency — alphabetically by code.
const OPTIONS = CURRENCIES.filter((code) => code !== "USD")
  .slice()
  .sort();

/** Footer twin of ThemeMenu: picks the secondary currency for price pills. */
export default function CurrencyMenu() {
  const currency = useCurrency();

  return (
    <DropdownMenu
      ariaLabel="Currency"
      value={currency}
      options={OPTIONS.map((code) => ({
        value: code,
        label: `${code} · ${CURRENCY_NAMES[code]}`,
      }))}
      onSelect={(next) => setCurrency(next as Currency)}
      buttonClassName={chrome.footerAction}
      buttonContent={<>Currency: {currency}</>}
      scrollable
    />
  );
}
