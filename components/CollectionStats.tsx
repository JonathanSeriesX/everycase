import { formatPrice, type Currency } from "../lib/currencies";
import card from "../styles/CaseInfoCards.module.css";
import styles from "../styles/CollectionStats.module.css";

/**
 * A single liquid-glass tile summarising an owned collection — the case-page
 * card shell wrapping "N devices / N accessories / worth $X at launch" chips.
 * Replaces the old "Owned" section heading + pills; launch value is USD-only
 * by design, same as CollectionHead was.
 */
export default function CollectionStats({
  deviceCount = 0,
  caseCount,
  sums = {},
  pricedCount = 0,
}: {
  deviceCount?: number;
  caseCount: number;
  sums?: Partial<Record<Currency, number>>;
  /** Accessories with a known USD launch price; the worth chip hides when 0. */
  pricedCount?: number;
}) {
  const stats: { key: string; label: string; title?: string }[] = [];
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
  if (stats.length === 0) return null;

  return (
    <div className={`${card.card} ${styles.tile}`}>
      <span className={card.label}>Stats</span>
      <div className={styles.stats}>
        {stats.map((stat) => (
          <span key={stat.key} className={styles.stat} title={stat.title}>
            {stat.label}
          </span>
        ))}
      </div>
    </div>
  );
}
