"use client";

import { useState } from "react";
import { formatPrice } from "../lib/productRegions";
import VerticalCarouselClient from "./VerticalCarousel.client";
import headingStyles from "../styles/SectionHeading.module.css";
import chrome from "../styles/Chrome.module.css";

const CURRENCIES = ["USD", "EUR", "GBP"];

// Reduces a list of amounts to {value, multiple}, or null when empty.
const reduce = (amounts) =>
  !amounts || amounts.length === 0
    ? null
    : { value: Math.min(...amounts), multiple: new Set(amounts).size > 1 };

// Price for the picked tab's model, falling back to the kind's aggregate when
// that model has no data for a currency.
const priceForModel = (price, model, code) =>
  reduce(price.byModel?.[model]?.[code]) ?? price[code];

/**
 * One kind of accessory on a model page: heading with price pills, the
 * editorial blurb (server-rendered, passed as children), and the case cards —
 * tabbed per model when the page covers several.
 *
 * The pills start on the kind's aggregate ("from $99") and switch to the
 * exact price of a model once the reader picks its tab — same behaviour the
 * old PricedSections/PricedHeading pair provided.
 */
export default function KindSectionClient({
  kind,
  slug,
  price,
  models,
  pageModelCount,
  children,
}) {
  const [active, setActive] = useState(0);
  // Aggregate until the reader explicitly interacts with the tabs.
  const [picked, setPicked] = useState(false);

  // Show the tab bar even for a single model when the page covers more —
  // a lone "iPhone 6-6s" tab tells the reader the Smart Battery Case never
  // came for the Plus.
  const showTabs = models.length > 1 || models.length < pageModelCount;

  const activeModel = picked ? models[active]?.model : null;
  const pills = CURRENCIES.map((code) => {
    const entry = activeModel
      ? priceForModel(price, activeModel, code)
      : price[code];
    if (!entry) return null;
    const formatted = formatPrice(entry.value, code);
    if (!formatted) return null;
    return {
      code,
      label: entry.multiple ? `from ${formatted}` : formatted,
    };
  }).filter(Boolean);

  return (
    <section>
      <div className={headingStyles.sectionHead}>
        <h2 id={slug} className={headingStyles.headingReset}>
          {kind}
        </h2>
        {pills.length > 0 && (
          <div className={headingStyles.pills} aria-hidden="true">
            {pills.map((pill) => (
              <span key={pill.code} className={headingStyles.pill}>
                {pill.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
      {showTabs && (
        <div
          role="tablist"
          aria-label={`${kind} by model`}
          className={chrome.tabList}
        >
          {models.map((entry, index) => (
            <button
              key={entry.model}
              role="tab"
              type="button"
              aria-selected={index === active}
              data-active={index === active}
              className={chrome.tab}
              onClick={(e) => {
                setActive(index);
                setPicked(true);
                e.currentTarget.blur();
              }}
            >
              {entry.model}
            </button>
          ))}
        </div>
      )}
      {models.map((entry, index) => (
        <div key={entry.model} role="tabpanel" hidden={index !== active}>
          <VerticalCarouselClient
            cases={entry.cases}
            model={entry.model}
            material={kind}
            standalone={!showTabs}
          />
        </div>
      ))}
    </section>
  );
}
