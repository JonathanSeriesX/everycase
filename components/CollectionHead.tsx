import { buildCollectionStats } from "../lib/collectionStats";
import styles from "../styles/SectionHeading.module.css";

/**
 * Collection section heading with stat pills — the same header/pill pattern
 * as kind sections on model pages.
 */
export default function CollectionHead({
  title,
  caseCount,
}: {
  title: string;
  /** Accessories in this section. */
  caseCount: number;
}) {
  const pills = buildCollectionStats({ caseCount });

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
