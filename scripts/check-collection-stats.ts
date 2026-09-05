// Run with: pnpm exec jiti scripts/check-collection-stats.ts
import assert from "node:assert/strict";
import {
  buildCollectionStats,
  computeLaunchValue,
} from "../lib/collectionStats";
import { getAllCasesFromCSV } from "../lib/getCasesFromCSV";

assert.deepEqual(computeLaunchValue([]), { totalUSD: 0, pricedCount: 0 });
assert.deepEqual(buildCollectionStats({ caseCount: 0 }), []);

const catalogue = getAllCasesFromCSV();
const cases = ["49", "19.50", "", "invalid", "Infinity"].map((USD) => ({
  ...catalogue[0],
  prices: { ...catalogue[0].prices, USD, EUR: "9999" },
}));
const value = computeLaunchValue(cases);
assert.deepEqual(value, { totalUSD: 68.5, pricedCount: 2 });
assert.deepEqual(
  buildCollectionStats({ deviceCount: 1, caseCount: cases.length, ...value }),
  [
    { key: "devices", label: "1 device" },
    { key: "accessories", label: "5 accessories" },
    {
      key: "worth",
      label: "worth $68.50 at launch",
      title: "Based on the 2 of 5 accessories with a known price",
    },
  ],
);
assert.equal(
  computeLaunchValue(catalogue).totalUSD,
  catalogue.reduce((total, item) => total + (Number(item.prices.USD) || 0), 0),
);
console.log("Collection stats checks passed.");
