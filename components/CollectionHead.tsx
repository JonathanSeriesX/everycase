import { buildCollectionStats } from "../lib/collectionStats";
import type { Currency } from "../lib/currencies";
import styles from "../styles/SectionHeading.module.css";

/**
 * Collection section heading with stat pills — the same header/pill pattern
 * as kind sections on model pages.
 */
export default function CollectionHead({
  title,
  deviceCount = 0,
  caseCount,
  sums = {},
  pricedCount = 0,
}: {
  title: string;
  deviceCount?: number;
  /** Accessories in this section. */
  caseCount: number;
  sums?: Partial<Record<Currency, number>>;
  /** Accessories with a known USD launch price; the worth pill hides when 0. */
  pricedCount?: number;
}) {
  const pills = buildCollectionStats({
    deviceCount,
    caseCount,
    sums,
    pricedCount,
  });

  return (
    <div className={styles.sectionHead}>
      <h2 className={styles.headingReset}>{title}</h2>
      {pills.length > 0 && (
        <div className={styles.pills}>
          {pills.map((pill) => (
            <span key={pill.key} className={styles.pill} title={pill.title}>
              {pill.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
