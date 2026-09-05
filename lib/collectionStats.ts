import { formatPrice } from "./currencies";
import type { CaseRecord } from "./getCasesFromCSV";

export function computeLaunchValue(cases: CaseRecord[]) {
  let totalUSD = 0;
  let pricedCount = 0;
  for (const item of cases) {
    const amount = Number(item.prices.USD);
    if (item.prices.USD && Number.isFinite(amount)) {
      totalUSD += amount;
      pricedCount += 1;
    }
  }
  return { totalUSD, pricedCount };
}

export interface CollectionStat {
  key: string;
  label: string;
  /** Tooltip — set on the worth stat when only some accessories have a price. */
  title?: string;
}

/**
 * The "N devices / N accessories / worth $X at launch" stat labels, shared by
 * the collection stats tile, the wishlist section heading, and the public
 * page's meta description. Launch value is USD-only by design.
 */
export function buildCollectionStats({
  deviceCount = 0,
  caseCount,
  totalUSD = 0,
  pricedCount = 0,
}: {
  deviceCount?: number;
  /** Accessories in this section. */
  caseCount: number;
  totalUSD?: number;
  /** Accessories with a known USD launch price; the worth stat hides when 0. */
  pricedCount?: number;
}): CollectionStat[] {
  const stats: CollectionStat[] = [];
  if (deviceCount > 0) {
    stats.push({
      key: "devices",
      label: `${deviceCount} device${deviceCount === 1 ? "" : "s"}`,
    });
  }
  if (caseCount > 0) {
    stats.push({
      key: "accessories",
      label: `${caseCount} accessor${caseCount === 1 ? "y" : "ies"}`,
    });
  }
  const worth = totalUSD ? formatPrice(totalUSD, "USD") : "";
  if (worth) {
    const partial = pricedCount > 0 && pricedCount < caseCount;
    stats.push({
      key: "worth",
      label: `worth ${worth} at launch`,
      title: partial
        ? `Based on the ${pricedCount} of ${caseCount} accessories with a known price`
        : undefined,
    });
  }
  return stats;
}
