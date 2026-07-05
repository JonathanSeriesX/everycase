"use client";

import { Fragment, useCallback, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { CopyIcon, CheckIcon, LinkArrowIcon } from "./icons";
import { formatPrice, type Currency } from "../lib/currencies";
import { useCurrency } from "../lib/useCurrency";
import CollectionCard from "./CollectionCard.client";
import styles from "../styles/CaseInfoCards.module.css";

const COPY_RESET_TIMEOUT = 1000;

export interface SkuGroup {
  label: string | null;
  orderNumbers: string[];
}

export interface SimilarCase {
  SKU: string;
  name: string;
}

/** Everything the info cards can show; assembled in app/case/[sku]/page. */
export interface CaseInfo {
  /** Primary SKU; presence enables the "Your collection" card. */
  collectionSku?: string;
  skuGroups?: SkuGroup[] | null;
  compatibleModels?: string[];
  similarCases?: SimilarCase[];
  releaseSku?: string;
  reReleaseSku?: string;
  releaseDate?: string;
  reReleaseDate?: string;
  /** Raw launch amounts per currency; the card shows USD + the chosen one. */
  msrp?: Partial<Record<Currency, string>>;
  eduPrice?: string;
}

// A single bordered, liquid-glass card. `wide` makes it span the full grid row.
export const InfoCard = ({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) => (
  <div className={`${styles.card} ${wide ? styles.cardWide : ""}`}>
    <span className={styles.label}>{label} </span>
    {children}
  </div>
);

// A label + plain value card (release date, MSRP, education price …).
export const StatCard = ({ label, value }: { label: string; value: string }) => (
  <InfoCard label={label}>
    <span className={styles.value}>{value}</span>
  </InfoCard>
);

// USD pill first, then the reader's footer-chosen currency (when we have a
// launch price for it). All amounts are baked into the static HTML — the
// hook only decides which one is displayed.
export const PriceCard = ({
  prices = {},
}: {
  prices?: Partial<Record<Currency, string>>;
}) => {
  const secondary = useCurrency();
  const shown = (["USD", secondary] as Currency[]).flatMap((code) => {
    const formatted = formatPrice(prices[code], code);
    return formatted ? [formatted] : [];
  });
  if (shown.length === 0) return null;

  return (
    <InfoCard label="MSRP">
      <div className={`${styles.chipRow} ${styles.priceRow}`}>
        {shown.map((price, index) => (
          <Fragment key={price}>
            <span className={`${styles.chip} ${styles.priceChip}`}>
              {price}
            </span>
            {/* Keep Pagefind excerpts and screen-reader output punctuated. */}
            <span className="sr-punctuation">
              {index < shown.length - 1 ? ", " : "."}
            </span>{" "}
          </Fragment>
        ))}
      </div>
    </InfoCard>
  );
};

// A copyable order-number pill. Clicking copies the order number and flashes a tick.
export const CopyChip = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
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
      className={`${styles.chip} ${styles.actionChip}`}
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

const CompatibilityChip = ({ value }: { value: string }) => (
  <span className={`${styles.chip} ${styles.compatibilityChip}`}>
    <span className={styles.compatibilityValue}>{value}</span>
  </span>
);

export const CompatibilityCard = ({
  compatibleModels = [],
}: {
  compatibleModels?: string[];
}) => {
  if (compatibleModels.length === 0) return null;

  return (
    <InfoCard label="Compatible with">
      <div className={`${styles.chipRow} ${styles.compatibilityRow}`}>
        {compatibleModels.map((model, index) => (
          <Fragment key={model}>
            <CompatibilityChip value={model} />
            {/* Invisible in the layout, but keeps the search index (and
                screen readers) reading a punctuated list, not a word soup. */}
            <span className="sr-punctuation">
              {index < compatibleModels.length - 1 ? ", " : "."}
            </span>{" "}
          </Fragment>
        ))}
      </div>
    </InfoCard>
  );
};

const SimilarCasesCard = ({ cases }: { cases: SimilarCase[] }) => {
  if (cases.length === 0) return null;

  return (
    <InfoCard label="Similar to" wide>
      <div className={`${styles.chipRow} ${styles.similaritiesRow}`}>
        {cases.map((item) => (
          <Link
            key={item.SKU}
            href={`/case/${item.SKU}`}
            className={`${styles.chip} ${styles.actionChip} ${styles.linkChip}`}
            title={item.name}
            aria-label={`${item.name} (${item.SKU})`}
          >
            <span className={styles.chipValue}>{item.SKU.slice(0, 5)}</span>
            <span className={styles.iconSwap} aria-hidden="true">
              <LinkArrowIcon
                className={`${styles.iconLayer} ${styles.linkIcon}`}
                strokeWidth={2.2}
              />
            </span>
          </Link>
        ))}
      </div>
    </InfoCard>
  );
};

// The order-number card. `skuGroups` is [{ label, orderNumbers }]; a single
// group with a null label renders as a plain row of chips (no sub-heading).
const OrderNumbersCard = ({ skuGroups }: { skuGroups: SkuGroup[] }) => {
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
  collectionSku = "",
  skuGroups = null,
  compatibleModels = [],
  similarCases = [],
  releaseSku = "",
  reReleaseSku = "",
  releaseDate = "",
  reReleaseDate = "",
  msrp = {},
  eduPrice = "",
}: CaseInfo) => (
  <div className={styles.grid}>
    {((skuGroups && skuGroups.length > 0) || compatibleModels.length > 0) && (
      <div className={styles.primaryRow}>
        {skuGroups && skuGroups.length > 0 && (
          <OrderNumbersCard skuGroups={skuGroups} />
        )}
        <CompatibilityCard compatibleModels={compatibleModels} />
      </div>
    )}
    <SimilarCasesCard cases={similarCases} />
    {releaseDate && (
      <StatCard
        label={releaseSku ? `${releaseSku} released on` : "Released on"}
        value={releaseDate}
      />
    )}
    {reReleaseDate && (
      <StatCard
        label={reReleaseSku ? `${reReleaseSku} released on` : "Re-released on"}
        value={reReleaseDate}
      />
    )}
    <PriceCard prices={msrp} />
    {eduPrice && <StatCard label="Education price" value={eduPrice} />}
    {collectionSku && <CollectionCard sku={collectionSku} />}
  </div>
);

export default CaseInfoCards;
