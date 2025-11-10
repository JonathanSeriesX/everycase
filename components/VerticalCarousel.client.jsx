"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./VerticalCarousel.module.css";
import CaseCard from "./CaseCard";

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
    (a.SKU || "").localeCompare(b.SKU || "")
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
          {sortedCases.map((item, index) => (
            <CaseCard
              key={item.SKU}
              item={item}
              index={index}
              isSmallViewport={isSmallViewport}
              copiedSku={copiedSku}
              displayLabel={displayLabel}
              buildSeasonLink={buildSeasonLink}
              formatSkuLabel={formatSkuLabel}
              copySku={copySku}
            />
          ))}
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
