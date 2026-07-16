"use client";

import { Fragment, useCallback, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { LinkArrowIcon } from "./icons";
import { formatPrice, type Currency } from "../lib/currencies";
import { useCurrency } from "../lib/useCurrency";
import { copyToClipboard } from "../lib/clipboard";
import CollectionCard from "./CollectionCard.client";
import CopySwapIcon from "./CopySwapIcon";
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

// A row of chips with an invisible ", " between them and a "." after the
// last. The separators keep Pagefind excerpts and screen-reader output
// reading as a punctuated list instead of a word soup; the trailing spaces
// do the same for plain text scrapers (flex layout ignores both).
const PunctuatedChips = ({
  className,
  items,
}: {
  className: string;
  items: { key: string; chip: ReactNode }[];
}) => (
  <div className={className}>
    {items.map(({ key, chip }, index) => (
      <Fragment key={key}>
        {chip}
        <span className="sr-punctuation">
          {index < items.length - 1 ? ", " : "."}
        </span>{" "}
      </Fragment>
    ))}
  </div>
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
      <PunctuatedChips
        className={`${styles.chipRow} ${styles.priceRow}`}
        items={shown.map((price) => ({
          key: price,
          chip: (
            <span className={`${styles.chip} ${styles.priceChip}`}>
              {price}
            </span>
          ),
        }))}
      />
    </InfoCard>
  );
};

// A copyable order-number pill. Clicking copies the order number and flashes a tick.
export const CopyChip = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      void copyToClipboard(value).then((landed) => {
        if (!landed) return;
        setCopied(true);
        setTimeout(() => setCopied(false), COPY_RESET_TIMEOUT);
      });
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
      <CopySwapIcon copied={copied} styles={styles} />
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
      <PunctuatedChips
        className={`${styles.chipRow} ${styles.compatibilityRow}`}
        items={compatibleModels.map((model) => ({
          key: model,
          chip: <CompatibilityChip value={model} />,
        }))}
      />
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
          <PunctuatedChips
            className={styles.chipRow}
            items={group.orderNumbers.map((orderNumber) => ({
              key: orderNumber,
              chip: <CopyChip value={orderNumber} />,
            }))}
          />
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
  orderCard,
}: CaseInfo & {
  /** Replaces the order-numbers card — keyboard pages slot in their own
      card with the language picker (see KeyboardProductDetails). */
  orderCard?: ReactNode;
}) => (
  <div className={styles.grid}>
    {(orderCard ||
      (skuGroups && skuGroups.length > 0) ||
      compatibleModels.length > 0) && (
      <div className={styles.primaryRow}>
        {orderCard ??
          (skuGroups && skuGroups.length > 0 && (
            <OrderNumbersCard skuGroups={skuGroups} />
          ))}
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
