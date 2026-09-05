import { buildCollectionStats } from "../lib/collectionStats";
import card from "../styles/CaseInfoCards.module.css";
import styles from "../styles/CollectionStats.module.css";

/**
 * A single liquid-glass tile summarising an owned collection — the case-page
 * card shell wrapping "N devices / N accessories / worth $X at launch" chips.
 */
export default function CollectionStats({
  deviceCount = 0,
  caseCount,
  totalUSD = 0,
  pricedCount = 0,
}: {
  deviceCount?: number;
  caseCount: number;
  totalUSD?: number;
  /** Accessories with a known USD launch price; the worth chip hides when 0. */
  pricedCount?: number;
}) {
  const stats = buildCollectionStats({
    deviceCount,
    caseCount,
    totalUSD,
    pricedCount,
  });
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
