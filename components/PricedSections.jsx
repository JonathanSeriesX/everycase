import { cache } from "react";
import { getAllCasesFromCSV } from "../lib/getCasesFromCSV.mjs";
import { PriceMapProvider } from "./PriceMapProvider.client";

const getCachedCases = cache(() => getAllCasesFromCSV());

// Reduces a set of distinct amounts to the value we display: the lowest price,
// flagged as `multiple` when a kind spans more than one price (so the heading
// can render "from $X").
const reduceAmounts = (amounts) => {
  if (amounts.size === 0) return null;
  const values = [...amounts];
  return { value: Math.min(...values), multiple: values.length > 1 };
};

const addAmount = (set, raw) => {
  const amount = Number(String(raw || "").trim());
  if (Number.isFinite(amount) && amount > 0) set.add(amount);
};

/**
 * Wraps page content and provides a price map (keyed by lowercased product
 * kind) for a single model. The markdown headings inside stay real `##`
 * headings — so Nextra's table of contents and anchors are unaffected — and the
 * h2 component override decorates matching ones with price pills.
 *
 * @param {Object} props
 * @param {string} props.model - Catalogue model whose prices this page shows.
 * @param {React.ReactNode} props.children
 */
const PricedSections = ({ model, children }) => {
  const target = String(model || "").trim();
  const buckets = new Map();

  if (target) {
    for (const row of getCachedCases()) {
      if (row.model !== target) continue;
      const kind = String(row.kind || "").trim();
      if (!kind) continue;
      const key = kind.toLowerCase();
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { USD: new Set(), EUR: new Set(), GBP: new Set() };
        buckets.set(key, bucket);
      }
      addAmount(bucket.USD, row.MSRP);
      addAmount(bucket.EUR, row.MSRP_EUR);
      addAmount(bucket.GBP, row.MSRP_GBP);
    }
  }

  const priceMap = {};
  for (const [key, bucket] of buckets) {
    priceMap[key] = {
      USD: reduceAmounts(bucket.USD),
      EUR: reduceAmounts(bucket.EUR),
      GBP: reduceAmounts(bucket.GBP),
    };
  }

  return <PriceMapProvider value={priceMap}>{children}</PriceMapProvider>;
};

export default PricedSections;
