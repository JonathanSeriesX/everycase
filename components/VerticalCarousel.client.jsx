"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./VerticalCarousel.module.css";
import CaseCard from "./CaseCard";

const SMALL_VIEWPORT_BREAKPOINT = 600;
const COPY_BADGE_RESET_TIMEOUT = 1600;

// Keep SKU ordering predictable even if CSV order changes between builds.
const sortCasesBySku = (caseList = []) =>
  [...caseList].sort((a, b) => (a?.SKU || "").localeCompare(b?.SKU || ""));

// Builds a stable link so users can jump to the season table when curious.
const buildSeasonLink = (seasonLabel) => {
  if (!seasonLabel) return "https://example.com/season/unknown";
  const normalized = seasonLabel.trim().replace(/\s+/g, "_");
  return `https://example.com/season/${encodeURIComponent(normalized)}`;
};

const formatSkuLabel = (sku) => (sku || "").replace(/zm\/?a?$/i, "");

const getDisplayLabel = (itemColour, itemModel, model, material) => {
  const normalizedMaterial = material?.trim().toLowerCase();
  if (normalizedMaterial === "clear case") {
    return itemModel || model;
  }
  if (itemColour === "Clear Case") {
    return model || itemModel;
  }
  return itemColour;
};

// Lightweight viewport tracker for toggling SKU suffixes on mobile.
const useSmallViewport = (breakpoint = SMALL_VIEWPORT_BREAKPOINT) => {
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => {
      setIsSmallViewport(window.innerWidth < breakpoint);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isSmallViewport;
};

const VerticalCarouselClient = ({ cases = [], model, material, season }) => {
  const isSmallViewport = useSmallViewport();
  const [copiedSku, setCopiedSku] = useState(null);

  const sortedCases = useMemo(() => sortCasesBySku(cases), [cases]);

  // Map colour/model labels consistently across sections of the UI.
  const displayLabel = useCallback(
    (itemColour, itemModel) =>
      getDisplayLabel(itemColour, itemModel, model, material),
    [material, model],
  );

  const copySku = useCallback((skuWithSuffix, key) => {
    if (!skuWithSuffix || typeof navigator === "undefined") return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(skuWithSuffix)
        .then(() => {
          // Flash the success icon without affecting sibling cards.
          setCopiedSku(key);
          setTimeout(() => {
            setCopiedSku((current) => (current === key ? null : current));
          }, COPY_BADGE_RESET_TIMEOUT);
        })
        .catch(() => {});
    }
  }, []);

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
