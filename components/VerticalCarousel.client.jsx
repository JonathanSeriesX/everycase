"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CopyIcon,
  CheckIcon,
  LinkArrowIcon,
} from "nextra/icons";
import styles from "./VerticalCarousel.module.css";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
// /MF039 will be put in between these two
const CAROUSEL_IMAGE_BASE_FORMAT = "webp";

const VerticalCarouselClient = ({ cases = [], model, material, season }) => {
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallViewport(window.innerWidth < 600);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [copiedSku, setCopiedSku] = useState(null);

  const sortedCases = [...cases].sort((a, b) =>
    (a.SKU || "").localeCompare(b.SKU || ""),
  );

  const displayLabel = (itemColour, itemModel) => {
    if (
      typeof material === "string" &&
      material.trim().toLowerCase() === "clear case"
    ) {
      return itemModel || model;
    }
    if (itemColour === "Clear Case") {
      return model || itemModel;
    }
    return itemColour;
  };

  const copySku = useCallback((skuWithSuffix, key) => {
    if (!skuWithSuffix || typeof navigator === "undefined") return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(skuWithSuffix)
        .then(() => {
          setCopiedSku(key);
          setTimeout(() => {
            setCopiedSku((current) => (current === key ? null : current));
          }, 1600);
        })
        .catch(() => {});
    }
  }, []);

  const buildSeasonLink = (seasonLabel) => {
    if (!seasonLabel) return "https://example.com/season/unknown";
    const normalized = seasonLabel.trim().replace(/\s+/g, "_");
    return `https://example.com/season/${encodeURIComponent(normalized)}`;
  };

  const formatSkuLabel = (sku) => (sku || "").replace(/zm\/?a?$/i, "");

  return (
    <>
      <div className={styles.carouselWrapper}>
        <div className={styles.cardTrack}>
          {sortedCases.map((item, index) => {
            const isPriorityImage = index < 5;
            const imageAlt = `${item.model} ${item.kind}${
              item.kind === "Clear Case" ? "" : ` — ${item.colour}`
            }`;
            const imageCode = (item.alt_thumbnail || item.SKU || "").trim();
            const imageSrc = imageCode
              ? `${CAROUSEL_IMAGE_BASE_URL}/${imageCode}.${CAROUSEL_IMAGE_BASE_FORMAT}`
              : "";
            return (
              <article key={item.SKU} className={styles.caseCard}>
                <Link
                  href={`/case/${item.SKU}`}
                  className={styles.cardLink}
                  aria-label={`${item.model} ${item.kind}`}
                >
                  <div className={styles.imageShell}>
                    <Image
                      src={imageSrc}
                      width={512}
                      height={512}
                      alt={imageAlt}
                      className={styles.image}
                      fetchPriority={isPriorityImage ? "high" : "low"}
                      loading={isPriorityImage ? "eager" : "lazy"}
                      unoptimized="true"
                      title={imageAlt}
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
                      copySku(
                        item.SKU + (isSmallViewport ? "ZM" : "ZM/A"),
                        item.SKU,
                      )
                    }
                  >
                    <span>{formatSkuLabel(item.SKU)}</span>
                    <span className={styles.iconSwap} aria-hidden="true">
                      <CopyIcon
                        className={`${styles.iconLayer} ${
                          copiedSku === item.SKU
                            ? styles.iconHidden
                            : styles.iconVisible
                        }`}
                      />
                      <CheckIcon
                        className={`${styles.iconLayer} ${
                          copiedSku === item.SKU
                            ? styles.iconVisible
                            : styles.iconHidden
                        }`}
                      />
                    </span>
                  </button>
                  <a
                    className={`${styles.metaBadge} ${styles.metaBadgeSecondary} ${styles.linkBadge}`}
                    href={buildSeasonLink(item.season)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{item.season || "—"}</span>
                    <LinkArrowIcon className={styles.icon} aria-hidden />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {sortedCases.length === 0 && (
        <p className={styles.emptyState}>
          No cases found for model {model}
          {material ? ` — ${material}` : ""}
          {season ? ` — ${season}` : ""}.
        </p>
      )}
    </>
  );
};

export default VerticalCarouselClient;
