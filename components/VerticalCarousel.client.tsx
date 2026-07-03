"use client";

import { useCallback, useState } from "react";
import CaseCard from "./CaseCard";
import type { CaseRecord } from "../lib/getCasesFromCSV";
import styles from "../styles/VerticalCarousel.module.css";

const COPY_BADGE_RESET_TIMEOUT = 1600;

const formatSkuLabel = (sku: string) => (sku || "").replace(/zm\/?a?$/i, "");

// What the card's title line shows. Normally the colour — except for Clear
// Cases, where every colour would read "Clear", so the model name is used.
const getDisplayLabel = (
  itemColour: string,
  itemModel: string,
  model?: string,
  material?: string,
) => {
  const normalizedMaterial = material?.trim().toLowerCase();
  if (normalizedMaterial === "clear case") {
    return itemModel || model;
  }
  if (itemColour === "Clear Case") {
    return model || itemModel;
  }
  return itemColour;
};

interface VerticalCarouselProps {
  /** Pre-sorted by the server (see sortCases in lib/catalogue). */
  cases?: CaseRecord[];
  model?: string;
  material?: string;
  standalone?: boolean;
  primary?: boolean;
  /** False while this grid's hidden tab panel is still queued behind the
      visible content (see KindSectionClient). */
  activated?: boolean;
}

const VerticalCarouselClient = ({
  cases = [],
  model,
  material,
  standalone = false,
  primary = true,
  activated = true,
}: VerticalCarouselProps) => {
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Map colour/model labels consistently across sections of the UI.
  const displayLabel = useCallback(
    (itemColour: string, itemModel: string) =>
      getDisplayLabel(itemColour, itemModel, model, material),
    [material, model],
  );

  const copySku = useCallback((skuWithSuffix: string, key: string) => {
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
          {cases.map((item) => (
            <CaseCard
              key={item.SKU}
              item={item}
              priority={primary}
              activated={activated}
              copiedSku={copiedSku}
              displayLabel={displayLabel}
              formatSkuLabel={formatSkuLabel}
              copySku={copySku}
            />
          ))}
        </div>
      </div>
      {cases.length === 0 && (
        <p className={styles.emptyState}>
          No cases found for model {model}
          {material ? ` — ${material}` : ""}.
        </p>
      )}
    </>
  );
};

export default VerticalCarouselClient;
