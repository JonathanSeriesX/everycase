"use client";

import { useSyncExternalStore } from "react";
import {
  CURRENCIES,
  DEFAULT_SECONDARY_CURRENCY,
  type Currency,
} from "./currencies";

// The reader's secondary currency (USD is always shown), persisted in
// localStorage. Pages stay fully static — every currency's amount is baked
// into the HTML and this hook only decides which one is displayed. The
// server (and hydration) render the EUR default; the stored choice applies
// right after mount, exactly like the theme.

const STORAGE_KEY = "currency";
const CHANGE_EVENT = "currencychange";

const isSecondary = (value: string | null): value is Currency =>
  value !== "USD" && CURRENCIES.includes((value ?? "") as Currency);

function readCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isSecondary(stored) ? stored : DEFAULT_SECONDARY_CURRENCY;
  } catch {
    return DEFAULT_SECONDARY_CURRENCY;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setCurrency(next: Currency) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode etc. — the event still updates this tab */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useCurrency(): Currency {
  return useSyncExternalStore(
    subscribe,
    readCurrency,
    () => DEFAULT_SECONDARY_CURRENCY,
  );
}
