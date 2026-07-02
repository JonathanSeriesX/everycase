"use client";

import Link from "next/link";
import { CopyIcon, CheckIcon } from "./icons";
import CaseImage from "./CaseImage.client";
import { formatOrderNumber, getPreferredRegion } from "../lib/productRegions";
import styles from "../styles/VerticalCarousel.module.css";

const PRIORITY_IMAGE_COUNT = 5;

const CaseCard = ({
  item,
  index,
  copiedSku,
  displayLabel,
  formatSkuLabel,
  copySku,
}) => {
  const imageAlt = (item.name || "").trim();
  const imageCode = (item.alt_thumbnail || item.SKU || "").trim();
  const orderNumber = formatOrderNumber(
    item.SKU,
    getPreferredRegion(item.regions),
  );

  return (
    <article className={styles.caseCard}>
      <Link
        href={`/case/${item.SKU}`}
        className={styles.cardLink}
        aria-label={imageAlt || undefined}
        prefetch={false}
      >
        <div className={styles.imageShell}>
          <CaseImage
            code={imageCode}
            alt={imageAlt}
            priority={index < PRIORITY_IMAGE_COUNT}
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
          <span className={styles.iconSwap} aria-hidden="true">
            <CopyIcon
              className={`${styles.iconLayer} ${
                copiedSku === item.SKU ? styles.iconHidden : styles.iconVisible
              }`}
            />
            <CheckIcon
              className={`${styles.iconLayer} ${
                copiedSku === item.SKU ? styles.iconVisible : styles.iconHidden
              }`}
            />
          </span>
        </button>{" "}
        {item.colour !== "Clear" && item.season ? (
          <span
            className={`${styles.metaBadge} ${styles.metaBadgeSecondary} ${styles.linkBadge}`}
          >
            {item.season}
          </span>
        ) : null}
      </div>
    </article>
  );
};

export default CaseCard;
