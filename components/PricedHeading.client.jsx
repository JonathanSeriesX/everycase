"use client";

import { Children } from "react";
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { formatPrice } from "../lib/productRegions";
import { usePriceMap } from "./PriceMapProvider.client";
import styles from "../styles/SectionHeading.module.css";

const themeComponents = getThemeComponents();

const CURRENCIES = ["USD", "EUR", "GBP"];

// Flattens heading children down to their plain text so we can match against
// the price map keys (e.g. <code>Beats</code> Case -> "beats case").
const textOf = (children) =>
  Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : child?.props?.children
          ? textOf(child.props.children)
          : "",
    )
    .join("");

/**
 * Drop-in replacement for the MDX `h2`. When the surrounding <PricedSections>
 * has a price for this heading's text, it renders the title plus up to three
 * non-interactive price pills ($ / € / £); otherwise it renders the default
 * Nextra heading unchanged. The underlying heading stays a real h2 with its id
 * and anchor, so the table of contents is unaffected.
 */
// Resolves a heading's text to a price entry. Prefers an exact kind match,
// otherwise the longest kind the heading starts with — so "Leather Wallet with
// MagSafe" matches "Leather Wallet" while "Magic Keyboard Folio" still wins over
// "Magic Keyboard".
const matchPrice = (priceMap, key) => {
  if (priceMap[key]) return priceMap[key];
  let best = null;
  let bestLen = 0;
  for (const kind of Object.keys(priceMap)) {
    if (key.startsWith(`${kind} `) && kind.length > bestLen) {
      best = priceMap[kind];
      bestLen = kind.length;
    }
  }
  return best;
};

const PricedHeading = ({ id, children, ...props }) => {
  const priceMap = usePriceMap();
  const key = textOf(children).trim().toLowerCase();
  const price = id ? matchPrice(priceMap, key) : undefined;

  const pills = price
    ? CURRENCIES.map((code) => {
        const entry = price[code];
        if (!entry) return null;
        const formatted = formatPrice(entry.value, code);
        if (!formatted) return null;
        return {
          code,
          label: entry.multiple ? `from ${formatted}` : formatted,
        };
      }).filter(Boolean)
    : [];

  if (pills.length === 0) {
    return (
      <themeComponents.h2 id={id} {...props}>
        {children}
      </themeComponents.h2>
    );
  }

  return (
    <div className={styles.sectionHead}>
      <themeComponents.h2 id={id} className={styles.headingReset} {...props}>
        {children}
      </themeComponents.h2>
      <div className={styles.pills} aria-hidden="true">
        {pills.map((pill) => (
          <span key={pill.code} className={styles.pill}>
            {pill.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PricedHeading;
