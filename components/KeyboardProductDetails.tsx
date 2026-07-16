"use client";

import { useMemo, useState } from "react";
import { GallerySection, type GalleryImage } from "./LightboxComponent";
import CaseInfoCards, {
  CopyChip,
  InfoCard,
  type CaseInfo,
} from "./CaseInfoCards";
import {
  formatOrderNumber,
  getKeyboardLanguageName,
  getPreferredRegion,
} from "../lib/productRegions";
import styles from "../styles/KeyboardProductDetails.module.css";

export interface KeyboardRegionOption {
  region: string;
  images: GalleryImage[];
  /** Base SKU for this language's order number, when it differs from the
      page's primary SKU (merged international keyboard siblings). */
  sku?: string;
}

interface KeyboardProductDetailsProps {
  sku: string;
  regionOptions?: KeyboardRegionOption[];
  fallbackImages?: GalleryImage[];
  info?: CaseInfo;
  /** Preselected language; falls back to the usual region preference. */
  defaultRegion?: string;
}

/**
 * The interactive half of a keyboard case page: the usual info cards, but
 * with the order-number card swapped for one that follows a language picker
 * — order number and gallery both track the selected layout.
 */
const KeyboardProductDetails = ({
  sku,
  regionOptions = [],
  fallbackImages = [],
  info = {},
  defaultRegion: defaultRegionProp,
}: KeyboardProductDetailsProps) => {
  const defaultRegion =
    (defaultRegionProp &&
      regionOptions.some((option) => option.region === defaultRegionProp) &&
      defaultRegionProp) ||
    getPreferredRegion(regionOptions.map((option) => option.region));
  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);
  const selectedOption = useMemo(
    () =>
      regionOptions.find((option) => option.region === selectedRegion) ||
      regionOptions[0],
    [regionOptions, selectedRegion],
  );

  // The keyboard layout owns the order-number card, so the plain SKU groups
  // never render here; similar-case suggestions don't apply to keyboards.
  const cardInfo = { ...info, skuGroups: null, similarCases: [] };

  // No regions on record at all: plain cards and the default gallery.
  if (!selectedOption) {
    return (
      <>
        <CaseInfoCards {...cardInfo} />
        <GallerySection images={fallbackImages} />
      </>
    );
  }

  const orderNumber = formatOrderNumber(
    selectedOption.sku ?? sku,
    selectedOption.region,
  );

  return (
    <>
      <CaseInfoCards
        {...cardInfo}
        orderCard={
          <InfoCard label="Order number">
            <div className={styles.keyboardOrderRow}>
              {/* keyed so the copy state resets when the language changes */}
              <CopyChip key={selectedOption.region} value={orderNumber} />
              {regionOptions.length > 1 ? (
                <select
                  id="keyboard-language"
                  aria-label="Keyboard language"
                  className={styles.languageSelect}
                  value={selectedOption.region}
                  onChange={(event) => setSelectedRegion(event.target.value)}
                >
                  {regionOptions.map((option) => (
                    <option key={option.region} value={option.region}>
                      {`${getKeyboardLanguageName(option.region)} `}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={styles.languageOnly}>
                  {`${getKeyboardLanguageName(selectedOption.region)} only`}
                </span>
              )}
            </div>
          </InfoCard>
        }
      />
      {/* keyed so the gallery resets to the first shot on a language change */}
      <GallerySection key={selectedOption.region} images={selectedOption.images} />
    </>
  );
};

export default KeyboardProductDetails;
