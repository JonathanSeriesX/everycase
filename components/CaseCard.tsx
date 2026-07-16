"use client";

import Link from "next/link";
import CopySwapIcon from "./CopySwapIcon";
import CaseImage from "./CaseImage.client";
import { formatOrderNumber, getPreferredRegion } from "../lib/productRegions";
import type { CaseRecord } from "../lib/getCasesFromCSV";
import styles from "../styles/VerticalCarousel.module.css";

interface CaseCardProps {
  item: CaseRecord;
  priority: boolean;
  /** False while the card's hidden tab panel is still queued behind the
      visible content (see KindSectionClient). */
  activated: boolean;
  /** SKU whose copy button currently shows the success tick. */
  copiedSku: string | null;
  displayLabel: (colour: string, model: string) => string | undefined;
  formatSkuLabel: (sku: string) => string;
  copySku: (orderNumber: string, sku: string) => void;
}

const CaseCard = ({
  item,
  priority,
  activated,
  copiedSku,
  displayLabel,
  formatSkuLabel,
  copySku,
}: CaseCardProps) => {
  const imageAlt = (item.name || "").trim();
  const imageCode = (item.alt_thumbnail || item.SKU || "").trim();
  const orderNumber = formatOrderNumber(
    item.SKU,
    getPreferredRegion(item.regions),
  );

  // The trailing space after </article> keeps text scrapers from gluing this
  // card's season badge to the next card's title ("Autumn 2025Black"); the
  // grid parent ignores whitespace-only text nodes.
  return (
    <>
      <article className={styles.caseCard}>
        <Link
          href={`/case/${item.SKU}`}
          className={styles.cardLink}
          aria-label={imageAlt || undefined}
        >
          <div className={styles.imageShell}>
            <CaseImage
              code={imageCode}
              alt={imageAlt}
              priority={priority}
              activated={activated}
            />
          </div>
          <strong className={`${styles.caseTitle} ${styles.linkTitle}`}>
            {displayLabel(item.colour, item.model)}
          </strong>
        </Link>
        <div className={styles.metaRow}>
          <button
            type="button"
            className={`${styles.metaBadge} ${styles.actionBadge}`}
            aria-label={`Copy ${orderNumber}`}
            title={`Copy ${orderNumber}`}
            onClick={(e) => {
              copySku(orderNumber, item.SKU);
              e.currentTarget.blur();
            }}
          >
            <span>{formatSkuLabel(item.SKU)}</span>
            <CopySwapIcon copied={copiedSku === item.SKU} styles={styles} />
          </button>{" "}
          {item.colour !== "Clear" && item.season ? (
            <span
              className={`${styles.metaBadge} ${styles.metaBadgeSecondary} ${styles.linkBadge}`}
            >
              {item.season}
            </span>
          ) : null}
        </div>
      </article>{" "}
    </>
  );
};

export default CaseCard;
