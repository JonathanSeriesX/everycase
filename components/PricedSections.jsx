import { cache } from "react";
import { getAllCasesFromCSV } from "../lib/getCasesFromCSV.mjs";
import {
  ActiveModelProvider,
  PriceMapProvider,
} from "./PriceMapProvider.client";

const getCachedCases = cache(() => getAllCasesFromCSV());

// Reduces a set of distinct amounts to the value we display: the lowest price,
// flagged as `multiple` when it spans more than one price (so the heading can
// render "from $X").
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
 * kind) for one or more models. The markdown headings inside stay real `##`
 * headings — so Nextra's table of contents and anchors are unaffected — and the
 * h2 component override decorates matching ones with price pills.
 *
 * Each kind carries both an aggregate price (the lowest across all the page's
 * models, shown as "from" when they differ) and a per-model breakdown, so the
 * heading can switch to a single model's exact price when the reader picks a
 * tab below it.
 *
 * @param {Object} props
 * @param {string|string[]} props.model - Catalogue model(s) this page shows.
 * @param {React.ReactNode} props.children
 */
const PricedSections = ({ model, children }) => {
  const targets = new Set(
    (Array.isArray(model) ? model : [model])
      .map((entry) => String(entry || "").trim())
      .filter(Boolean),
  );
  const buckets = new Map();

  if (targets.size > 0) {
    for (const row of getCachedCases()) {
      const rowModel = String(row.model || "").trim();
      if (!targets.has(rowModel)) continue;
      const kind = String(row.kind || "").trim();
      if (!kind) continue;
      const key = kind.toLowerCase();
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          USD: new Set(),
          EUR: new Set(),
          GBP: new Set(),
          models: new Map(),
        };
        buckets.set(key, bucket);
      }
      addAmount(bucket.USD, row.MSRP);
      addAmount(bucket.EUR, row.MSRP_EUR);
      addAmount(bucket.GBP, row.MSRP_GBP);

      let per = bucket.models.get(rowModel);
      if (!per) {
        per = { USD: new Set(), EUR: new Set(), GBP: new Set() };
        bucket.models.set(rowModel, per);
      }
      addAmount(per.USD, row.MSRP);
      addAmount(per.EUR, row.MSRP_EUR);
      addAmount(per.GBP, row.MSRP_GBP);
    }
  }

  const priceMap = {};
  for (const [key, bucket] of buckets) {
    const byModel = {};
    for (const [rowModel, per] of bucket.models) {
      byModel[rowModel] = {
        USD: [...per.USD],
        EUR: [...per.EUR],
        GBP: [...per.GBP],
      };
    }
    priceMap[key] = {
      USD: reduceAmounts(bucket.USD),
      EUR: reduceAmounts(bucket.EUR),
      GBP: reduceAmounts(bucket.GBP),
      byModel,
    };
  }

  return (
    <PriceMapProvider value={priceMap}>
      <ActiveModelProvider>{children}</ActiveModelProvider>
    </PriceMapProvider>
  );
};

export default PricedSections;
