"use client";

import { useCallback, useState } from "react";
import CaseCard from "./CaseCard";
import type { CaseRecord } from "../lib/getCasesFromCSV";
import styles from "../styles/VerticalCarousel.module.css";

const COPY_BADGE_RESET_TIMEOUT = 1600;

const formatSkuLabel = (sku: string) => (sku || "").replace(/zm\/?a?$/i, "");

// What the card's title line shows. Normally the colour — except for merged
// grids, which combine several models into one section (Clear Cases, the
// iPhone Dock), where the colour would repeat, so the model name is shown —
// run through the page's display overrides ("iPhone 5s-SE" → "iPhone 5s").
const getDisplayLabel = (
  itemColour: string,
  itemModel: string,
  model?: string,
  material?: string,
  merged?: boolean,
  modelLabels?: Record<string, string>,
) => {
  const normalizedMaterial = material?.trim().toLowerCase();
  if (merged || normalizedMaterial === "clear case") {
    const raw = itemModel || model;
    return (raw && modelLabels?.[raw]) || raw;
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
  /** Merged grid (no tabs): label cards by model rather than colour. */
  merged?: boolean;
  /** Display overrides for model names on merged cards (page.tabLabels). */
  modelLabels?: Record<string, string>;
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
  merged = false,
  modelLabels,
  standalone = false,
  primary = true,
  activated = true,
}: VerticalCarouselProps) => {
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Map colour/model labels consistently across sections of the UI.
  const displayLabel = useCallback(
    (itemColour: string, itemModel: string) =>
      getDisplayLabel(itemColour, itemModel, model, material, merged, modelLabels),
    [material, model, merged, modelLabels],
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
