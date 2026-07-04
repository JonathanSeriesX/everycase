"use client";

import { useRef } from "react";
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
  const anchorRef = useRef<HTMLSpanElement>(null);

  // Switching currency can reflow price pills far above the footer (a long
  // "¥49,800" wraps an MSRP card onto a second line). Chrome's scroll
  // anchoring hides that; Safari has none, so the page visibly jumps under
  // the open menu. Re-pin this menu's viewport position once the re-render
  // has committed — rAF runs pre-paint, so the correction is invisible, and
  // where the browser anchored natively the measured delta is zero.
  const pick = (next: string) => {
    const anchor = anchorRef.current;
    const before = anchor?.getBoundingClientRect().top;
    setCurrency(next as Currency);
    if (!anchor || before === undefined) return;
    requestAnimationFrame(() => {
      const delta = anchor.getBoundingClientRect().top - before;
      if (delta !== 0) window.scrollBy(0, delta);
    });
  };

  return (
    <span ref={anchorRef}>
      <DropdownMenu
        ariaLabel="Currency"
        value={currency}
        options={OPTIONS.map((code) => ({
          value: code,
          label: `${code} · ${CURRENCY_NAMES[code]}`,
        }))}
        onSelect={pick}
        buttonClassName={chrome.footerAction}
        buttonContent={<>Currency: {currency}</>}
        scrollable
      />
    </span>
  );
}
