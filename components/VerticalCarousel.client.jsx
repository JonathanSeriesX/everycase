"use client";

import { useMemo, useState, useCallback } from "react";
import styles from "../styles/VerticalCarousel.module.css";
import CaseCard from "./CaseCard";

const COPY_BADGE_RESET_TIMEOUT = 1600;

// Seasons are written as "<Season|Month> <Year>" (e.g. "Autumn 2023",
// "November 2016"). Map the leading word to a representative month so we can
// order chronologically, interleaving named seasons with explicit months.
const SEASON_MONTH = {
  spring: 3,
  summer: 6,
  autumn: 9,
  fall: 9,
  winter: 12,
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

// Sortable key: year * 100 + month. Unknown/blank seasons sort last.
const seasonSortKey = (season) => {
  const match = String(season || "")
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\s+(\d{4})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const month = SEASON_MONTH[match[1]] ?? 6;
  return parseInt(match[2], 10) * 100 + month;
};

// Order cards oldest → newest by season, then alphabetically by colour, with
// SKU as a final tiebreaker so ordering stays stable between builds.
const sortCases = (caseList = []) =>
  [...caseList].sort((a, b) => {
    const seasonDelta = seasonSortKey(a?.season) - seasonSortKey(b?.season);
    if (seasonDelta !== 0) return seasonDelta;
    const colourDelta = (a?.colour || "").localeCompare(b?.colour || "");
    if (colourDelta !== 0) return colourDelta;
    return (a?.SKU || "").localeCompare(b?.SKU || "");
  });

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

const VerticalCarouselClient = ({
  cases = [],
  model,
  material,
  season,
  standalone = false,
}) => {
  const [copiedSku, setCopiedSku] = useState(null);

  const sortedCases = useMemo(() => sortCases(cases), [cases]);

  // Map colour/model labels consistently across sections of the UI.
  const displayLabel = useCallback(
    (itemColour, itemModel) =>
      getDisplayLabel(itemColour, itemModel, model, material),
    [material, model]
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
      <div
        className={`${styles.carouselWrapper}${
          standalone ? ` ${styles.standalone}` : ""
        }`}
      >
        <div className={styles.cardTrack}>
          {sortedCases.map((item, index) => (
            <CaseCard
              key={item.SKU}
              item={item}
              index={index}
              copiedSku={copiedSku}
              displayLabel={displayLabel}
              formatSkuLabel={formatSkuLabel}
              copySku={copySku}
            />
          ))}
        </div>
      </div>
      {sortedCases.length === 0 && (
        <p className={styles.emptyState}>
          No cases found for model {Array.isArray(model) ? model.join(", ") : model}
          {material ? ` — ${material}` : ""}
          {season ? ` — ${season}` : ""}.
        </p>
      )}
    </>
  );
};

export default VerticalCarouselClient;
