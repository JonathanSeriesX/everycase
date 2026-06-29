"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CopyIcon, CheckIcon, LinkArrowIcon } from "nextra/icons";
import { formatOrderNumber, getPreferredRegion } from "../lib/productRegions";
import styles from "../styles/VerticalCarousel.module.css";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
// /MF039. will be put in between these two
const CAROUSEL_IMAGE_FORMATS = ["avif"];
const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const APPLE_FALLBACK_PARAMS = "?wid=512&hei=512&fmt=png-alpha";
const CASE_IMAGE_SIZE = 512;
const PRIORITY_IMAGE_COUNT = 5;

// Helpers keep the render block lean and make fallback handling testable.
const sanitizeImageCode = (item) =>
  (item?.alt_thumbnail || item?.SKU || "").trim();

const buildCarouselImageSrc = (code, format) =>
  code && format ? `${CAROUSEL_IMAGE_BASE_URL}/${code}.${format}` : "";

const buildAppleFallbackImageSrc = (code) =>
  code ? `${APPLE_IMAGE_BASE_URL}/${code}${APPLE_FALLBACK_PARAMS}` : "";

const buildImageAlt = ({ model = "", kind = "", colour = "" }) => {
  const normalizedKind = kind || "Case";
  const isClearCase = normalizedKind === "Clear Case";
  return `${model} ${normalizedKind}${
    isClearCase ? "" : ` — ${colour}`
  }`.trim();
};

const CaseCard = ({
  item,
  index,
  copiedSku,
  displayLabel,
  buildSeasonLink,
  formatSkuLabel,
  copySku,
}) => {
  const isPriorityImage = index < PRIORITY_IMAGE_COUNT;
  const imageAlt = buildImageAlt(item);
  const imageCode = sanitizeImageCode(item);
  const fallbackImageSrc = buildAppleFallbackImageSrc(imageCode);
  const candidateSources = useMemo(() => {
    const carouselSources = CAROUSEL_IMAGE_FORMATS.map((format) =>
      buildCarouselImageSrc(imageCode, format)
    );
    return [...carouselSources, fallbackImageSrc].filter(Boolean);
  }, [fallbackImageSrc, imageCode]);
  const sourceKey = candidateSources.join("|");
  const [sourceState, setSourceState] = useState({ key: sourceKey, index: 0 });
  const sourceIndex = sourceState.key === sourceKey ? sourceState.index : 0;

  // Step through CloudFront formats before falling back to Apple's CDN.
  const handleImageError = () => {
    setSourceState((currentState) => {
      const currentIndex =
        currentState.key === sourceKey ? currentState.index : 0;
      const nextIndex = currentIndex + 1;
      return {
        key: sourceKey,
        index:
          nextIndex < candidateSources.length ? nextIndex : currentIndex,
      };
    });
  };

  const imgSrc = candidateSources[sourceIndex] || "";
  const orderNumber = formatOrderNumber(
    item.SKU,
    getPreferredRegion(item.regions),
  );

  return (
    <article className={styles.caseCard}>
      <Link
        href={`/case/${item.SKU}`}
        className={styles.cardLink}
        aria-label={`${item.model} ${item.kind}`}
        prefetch={false}
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
          aria-label={`Copy ${orderNumber}`}
          title={`Copy ${orderNumber}`}
          onClick={() => copySku(orderNumber, item.SKU)}
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
        {" "}
        {/*<Link
          className={`${styles.metaBadge} ${styles.metaBadgeSecondary} ${styles.linkBadge}`}
          href={buildSeasonLink(item.season)}
          target="_blank"
          rel="noreferrer"
        >
          <span>{item.season || "—"}</span>
          <LinkArrowIcon className={styles.icon} aria-hidden />
        </Link> */}
        <span
          className={`${styles.metaBadge} ${styles.metaBadgeSecondary} ${styles.linkBadge}`}
        >
          {item.season || "—"}
        </span>
      </div>
    </article>
  );
};

export default CaseCard;
