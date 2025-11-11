"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CopyIcon, CheckIcon, LinkArrowIcon } from "nextra/icons";
import styles from "./VerticalCarousel.module.css";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
// /MF039. will be put in between these two
const CAROUSEL_IMAGE_BASE_FORMAT = "webp";
const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const APPLE_FALLBACK_PARAMS = "?wid=512&hei=512&fmt=png-alpha";
const CASE_IMAGE_SIZE = 512;
const PRIORITY_IMAGE_COUNT = 5;

const CaseCard = ({
  item,
  index,
  isSmallViewport,
  copiedSku,
  displayLabel,
  buildSeasonLink,
  formatSkuLabel,
  copySku,
}) => {
  const isPriorityImage = index < PRIORITY_IMAGE_COUNT;
  const imageAlt = `${item.model} ${item.kind}${
    item.kind === "Clear Case" ? "" : ` — ${item.colour}`
  }`;
  const imageCode = (item.alt_thumbnail || item.SKU || "").trim();
  const imageSrc = imageCode
    ? `${CAROUSEL_IMAGE_BASE_URL}/${imageCode}.${CAROUSEL_IMAGE_BASE_FORMAT}`
    : "";
  const fallbackImageSrc = imageCode
    ? `${APPLE_IMAGE_BASE_URL}/${imageCode}${APPLE_FALLBACK_PARAMS}`
    : "";
  const [imgSrc, setImgSrc] = useState(imageSrc);
  useEffect(() => {
    setImgSrc(imageSrc);
  }, [imageSrc]);

  const handleImageError = () => {
    if (fallbackImageSrc && imgSrc !== fallbackImageSrc) {
      setImgSrc(fallbackImageSrc);
    }
  };

  return (
    <article className={styles.caseCard}>
      <Link
        href={`/case/${item.SKU}`}
        className={styles.cardLink}
        aria-label={`${item.model} ${item.kind}`}
      >
        <div className={styles.imageShell}>
          <Image
            src={imgSrc}
            width={CASE_IMAGE_SIZE}
            height={CASE_IMAGE_SIZE}
            alt={imageAlt}
            className={styles.image}
            fetchPriority={isPriorityImage ? "high" : "low"}
            loading={isPriorityImage ? "eager" : "lazy"}
            unoptimized
            title={imageAlt}
            onError={handleImageError}
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
          aria-label="Copy SKU with suffix"
          onClick={() =>
            copySku(item.SKU + (isSmallViewport ? "ZM" : "ZM/A"), item.SKU)
          }
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
        </button>
        <Link
          className={`${styles.metaBadge} ${styles.metaBadgeSecondary} ${styles.linkBadge}`}
          href={buildSeasonLink(item.season)}
          target="_blank"
          rel="noreferrer"
        >
          <span>{item.season || "—"}</span>
          <LinkArrowIcon className={styles.icon} aria-hidden />
        </Link>
      </div>
    </article>
  );
};

export default CaseCard;
