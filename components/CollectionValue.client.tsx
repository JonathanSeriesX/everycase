"use client";

import { formatPrice, type Currency } from "../lib/currencies";
import { useCurrency } from "../lib/useCurrency";

/**
 * "Launch value" line on the collection page. Sums are precomputed on the
 * server for every currency; this only picks USD + the footer-chosen one,
 * mirroring PriceCard.
 */
export default function CollectionValue({
  sums,
  pricedCount,
  ownedCount,
  label = "Launch value of what you own",
}: {
  sums: Partial<Record<Currency, number>>;
  /** Owned cases with a known USD launch price. */
  pricedCount: number;
  ownedCount: number;
  label?: string;
}) {
  const secondary = useCurrency();
  const shown = (["USD", secondary] as Currency[]).flatMap((code) => {
    const formatted = sums[code] ? formatPrice(sums[code], code) : "";
    return formatted ? [formatted] : [];
  });
  if (shown.length === 0) return null;

  const partial = pricedCount < ownedCount;
  return (
    <p>
      {label}: <strong>{shown.join(" · ")}</strong>
      {partial && ` — based on the ${pricedCount} of ${ownedCount} cases with a known price`}
      .
    </p>
  );
}
