"use client";

import { CURRENCIES, CURRENCY_NAMES, type Currency } from "../lib/currencies";
import { setCurrency, useCurrency } from "../lib/useCurrency";
import styles from "../styles/Settings.module.css";

// USD is pinned as the first price pill everywhere, so this picks only the
// secondary currency — alphabetically by code.
const OPTIONS = CURRENCIES.filter((code) => code !== "USD")
  .slice()
  .sort();

/** Currency select on the settings page. */
export default function CurrencyControl() {
  const currency = useCurrency();

  return (
    <select
      className={styles.select}
      aria-label="Secondary currency"
      value={currency}
      onChange={(event) => setCurrency(event.target.value as Currency)}
    >
      {OPTIONS.map((code) => (
        <option key={code} value={code}>
          {code} · {CURRENCY_NAMES[code]}
        </option>
      ))}
    </select>
  );
}
