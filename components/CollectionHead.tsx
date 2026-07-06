import { formatPrice, type Currency } from "../lib/currencies";
import styles from "../styles/SectionHeading.module.css";

/**
 * Collection section heading with stat pills — the same header/pill pattern
 * as kind sections on model pages. Launch value is USD-only by design.
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
  const pills: { key: string; label: string; title?: string }[] = [];
  if (deviceCount > 0) {
    pills.push({
      key: "devices",
      label: `${deviceCount} device${deviceCount === 1 ? "" : "s"}`,
    });
  }
  if (caseCount > 0) {
    pills.push({
      key: "accessories",
      label: `${caseCount} accessor${caseCount === 1 ? "y" : "ies"}`,
    });
  }
  const worth = sums.USD ? formatPrice(sums.USD, "USD") : "";
  if (worth) {
    const partial = pricedCount > 0 && pricedCount < caseCount;
    pills.push({
      key: "worth",
      label: `worth ${worth} at launch`,
      title: partial
        ? `Based on the ${pricedCount} of ${caseCount} accessories with a known price`
        : undefined,
    });
  }

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
