import { formatPrice, type Currency } from "./currencies";

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
  sums = {},
  pricedCount = 0,
}: {
  deviceCount?: number;
  /** Accessories in this section. */
  caseCount: number;
  sums?: Partial<Record<Currency, number>>;
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
  const worth = sums.USD ? formatPrice(sums.USD, "USD") : "";
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
