"use client";

import { useMemo, useState } from "react";
import LightboxComponent from "./LightboxComponent";
import CaseInfoCards, {
  CompatibilityCard,
  CopyChip,
  InfoCard,
  PriceCard,
  StatCard,
} from "./CaseInfoCards";
import {
  formatOrderNumber,
  getKeyboardLanguageName,
  getPreferredRegion,
} from "../lib/productRegions";
import cardStyles from "../styles/CaseInfoCards.module.css";
import styles from "../styles/KeyboardProductDetails.module.css";


const KeyboardProductDetails = ({
  sku,
  regionOptions = [],
  fallbackImages = [],
  info = {},
}) => {
  const defaultRegion = getPreferredRegion(
    regionOptions.map((option) => option.region),
  );
  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);
  const selectedOption = useMemo(
    () =>
      regionOptions.find((option) => option.region === selectedRegion) ||
      regionOptions[0],
    [regionOptions, selectedRegion],
  );

  if (!selectedOption) {
    return (
      <>
        <CaseInfoCards
          releaseSku={info.releaseSku}
          reReleaseSku={info.reReleaseSku}
          releaseDate={info.releaseDate}
          reReleaseDate={info.reReleaseDate}
          msrp={info.msrp}
          eduPrice={info.eduPrice}
          compatibleModels={info.compatibleModels}
        />
        <section>
          <h2 id="image-gallery" data-pagefind-ignore>Image gallery</h2>
          <LightboxComponent images={fallbackImages} />
        </section>
      </>
    );
  }

  const languageName = getKeyboardLanguageName(selectedOption.region);
  const orderNumber = formatOrderNumber(sku, selectedOption.region);

  return (
    <>
      <div className={cardStyles.grid}>
        <div className={cardStyles.primaryRow}>
          <InfoCard label="Order number">
            <div className={styles.keyboardOrderRow}>
              {/* keyed so the copy state resets when the language changes */}
              <CopyChip key={selectedOption.region} value={orderNumber} />
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
            </div>
          </InfoCard>
          <CompatibilityCard compatibleModels={info.compatibleModels} />
        </div>
        {info.releaseDate && (
          <StatCard
            label={
              info.releaseSku ? `${info.releaseSku} released on` : "Released on"
            }
            value={info.releaseDate}
          />
        )}
        {info.reReleaseDate && (
          <StatCard
            label={
              info.reReleaseSku
                ? `${info.reReleaseSku} released on`
                : "Re-released on"
            }
            value={info.reReleaseDate}
          />
        )}
        <PriceCard prices={info.msrp} />
        {info.eduPrice && (
          <StatCard label="Education price" value={info.eduPrice} />
        )}
      </div>
      <section>
        <h2 id="image-gallery" data-pagefind-ignore>Image gallery</h2>
        <LightboxComponent
          key={selectedOption.region}
          images={selectedOption.images}
        />
      </section>
    </>
  );
};

export default KeyboardProductDetails;
