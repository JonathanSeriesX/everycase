"use client";

import { useCallback, useState } from "react";
import { CopyIcon, CheckIcon } from "nextra/icons";
import styles from "../styles/CaseInfoCards.module.css";

const COPY_RESET_TIMEOUT = 1000;

// A single bordered, liquid-glass card. `wide` makes it span the full grid row.
export const InfoCard = ({ label, children, wide = false }) => (
  <div className={`${styles.card} ${wide ? styles.cardWide : ""}`}>
    <span className={styles.label}>{label} </span>
    {children}
  </div>
);

// A label + plain value card (release date, MSRP, education price …).
export const StatCard = ({ label, value }) => (
  <InfoCard label={label}>
    <span className={styles.value}>{value}</span>
  </InfoCard>
);

// A copyable order-number pill. Clicking copies the order number and flashes a tick.
export const CopyChip = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (e) => {
      e.currentTarget.blur();
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }
      navigator.clipboard
        .writeText(value)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), COPY_RESET_TIMEOUT);
        })
        .catch(() => {});
    },
    [value],
  );

  return (
    <button
      type="button"
      className={styles.chip}
      onClick={copy}
      aria-label={`Copy ${value}`}
      title={`Copy ${value}`}
    >
      <span className={styles.chipValue}>{value}</span>
      <span className={styles.iconSwap} aria-hidden="true">
        <CopyIcon
          className={`${styles.iconLayer} ${
            copied ? styles.iconHidden : styles.iconVisible
          }`}
        />
        <CheckIcon
          className={`${styles.iconLayer} ${
            copied ? styles.iconVisible : styles.iconHidden
          }`}
        />
      </span>
    </button>
  );
};

const CompatibilityChip = ({ value }) => (
  <span className={`${styles.chip} ${styles.compatibilityChip}`}>
    <span className={styles.compatibilityValue}>{value}</span>
  </span>
);

export const CompatibilityCard = ({ compatibleModels = [] }) => {
  if (compatibleModels.length === 0) return null;

  return (
    <InfoCard label="Compatibility">
      <div className={`${styles.chipRow} ${styles.compatibilityRow}`}>
        {compatibleModels.map((model) => (
          <CompatibilityChip key={model} value={model} />
        ))}
      </div>
    </InfoCard>
  );
};

// The order-number card. `skuGroups` is [{ label, orderNumbers }]; a single
// group with a null label renders as a plain row of chips (no sub-heading).
const OrderNumbersCard = ({ skuGroups }) => {
  const totalOrderNumbers = skuGroups.reduce(
    (total, group) => total + group.orderNumbers.length,
    0,
  );
  const label = totalOrderNumbers === 1 ? "Order number" : "Order numbers";

  return (
    <InfoCard label={label}>
      {skuGroups.map((group, index) => (
        <div key={group.label ?? index} className={styles.skuGroup}>
          {group.label && (
            <span className={styles.skuGroupLabel}>{group.label} </span>
          )}
          <div className={styles.chipRow}>
            {group.orderNumbers.map((orderNumber) => (
              <CopyChip key={orderNumber} value={orderNumber} />
            ))}
          </div>
        </div>
      ))}
    </InfoCard>
  );
};

const CaseInfoCards = ({
  skuGroups = null,
  compatibleModels = [],
  releaseDate = "",
  reReleaseDate = "",
  msrp = "",
  eduPrice = "",
}) => (
  <div className={styles.grid}>
    {((skuGroups && skuGroups.length > 0) || compatibleModels.length > 0) && (
      <div className={styles.primaryRow}>
        {skuGroups && skuGroups.length > 0 && (
          <OrderNumbersCard skuGroups={skuGroups} />
        )}
        <CompatibilityCard compatibleModels={compatibleModels} />
      </div>
    )}
    {releaseDate && <StatCard label="Released on" value={releaseDate} />}
    {reReleaseDate && <StatCard label="Re-released on" value={reReleaseDate} />}
    {msrp && <StatCard label="MSRP" value={msrp} />}
    {eduPrice && <StatCard label="Education price" value={eduPrice} />}
  </div>
);

export default CaseInfoCards;
