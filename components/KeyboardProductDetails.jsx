"use client";

import { useMemo, useState } from "react";
import { Callout } from "nextra/components";
import LightboxComponent from "./LightboxComponent";
import {
  formatOrderNumber,
  getKeyboardLanguageName,
  getPreferredRegion,
} from "../lib/productRegions";
import styles from "../styles/KeyboardProductDetails.module.css";

const KeyboardProductDetails = ({
  sku,
  regionOptions = [],
  fallbackImages = [],
  galleryHeading,
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
        <Callout type="warning" emoji="👉🏻">
          <strong>{sku}</strong> is the base SKU. Its keyboard language suffix
          is not available in the catalogue yet.
        </Callout>
        <section>
          {galleryHeading}
          <LightboxComponent images={fallbackImages} />
        </section>
      </>
    );
  }

  const languageName = getKeyboardLanguageName(selectedOption.region);
  const orderNumber = formatOrderNumber(sku, selectedOption.region);

  return (
    <>
      <Callout type="info" emoji="👉🏻">
        <strong>{orderNumber}</strong> is the order number for the {languageName}{" "}
        keyboard.
      </Callout>
      <div className={styles.languagePicker}>
        <label className={styles.languageLabel} htmlFor="keyboard-language">
          Keyboard language
          <span className={styles.languageHint}>
            Updates the order number and gallery
          </span>
        </label>
        <select
          id="keyboard-language"
          className={styles.languageSelect}
          value={selectedOption.region}
          onChange={(event) => setSelectedRegion(event.target.value)}
        >
          {regionOptions.map((option) => (
            <option key={option.region} value={option.region}>
              {getKeyboardLanguageName(option.region)} — {option.region}
            </option>
          ))}
        </select>
      </div>
      <section>
        {galleryHeading}
        <LightboxComponent
          key={selectedOption.region}
          images={selectedOption.images}
        />
      </section>
    </>
  );
};

export default KeyboardProductDetails;
