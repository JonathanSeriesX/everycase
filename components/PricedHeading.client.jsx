"use client";

import { Children } from "react";
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { formatPrice } from "../lib/productRegions";
import { useActiveModels, usePriceMap } from "./PriceMapProvider.client";
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

// Resolves a heading's text to its price entry plus the kind key that matched.
// Prefers an exact kind match, otherwise the longest kind the heading starts
// with — so "Leather Wallet with MagSafe" matches "Leather Wallet" while "Magic
// Keyboard Folio" still wins over "Magic Keyboard".
const matchKind = (priceMap, key) => {
  if (priceMap[key]) return { kind: key, entry: priceMap[key] };
  let best = null;
  let bestLen = 0;
  for (const kind of Object.keys(priceMap)) {
    if (key.startsWith(`${kind} `) && kind.length > bestLen) {
      best = { kind, entry: priceMap[kind] };
      bestLen = kind.length;
    }
  }
  return best;
};

// Reduces a list of amounts to {value, multiple}, or null when empty.
const reduce = (amounts) =>
  amounts.length === 0
    ? null
    : { value: Math.min(...amounts), multiple: new Set(amounts).size > 1 };

// Price for the active tab's model(s): unions the per-model amounts for each
// selected model, falling back to the kind's aggregate when that model has no
// data for a currency.
const priceForModel = (entry, model, code) => {
  const models = Array.isArray(model) ? model : [model];
  const amounts = models.flatMap((m) => entry.byModel?.[m]?.[code] ?? []);
  return reduce(amounts) ?? entry[code];
};

/**
 * Drop-in replacement for the MDX `h2`. When the surrounding <PricedSections>
 * has a price for this heading's text, it renders the title plus up to three
 * non-interactive price pills ($ / € / £); otherwise it renders the default
 * Nextra heading unchanged. The underlying heading stays a real h2 with its id
 * and anchor, so the table of contents is unaffected.
 *
 * If the reader picks a tab in the <CaseTableTabs> below, the pills switch from
 * the kind's aggregate ("from $99") to that model's exact price ("$129").
 */
const PricedHeading = ({ id, children, ...props }) => {
  const priceMap = usePriceMap();
  const { activeByKind } = useActiveModels();
  const key = textOf(children).trim().toLowerCase();
  const match = id ? matchKind(priceMap, key) : null;

  const activeModel = match ? activeByKind[match.kind] : undefined;

  const pills = match
    ? CURRENCIES.map((code) => {
        const entry =
          activeModel != null
            ? priceForModel(match.entry, activeModel, code)
            : match.entry[code];
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
