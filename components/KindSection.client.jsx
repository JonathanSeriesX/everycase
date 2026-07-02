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

// Price for a model, falling back to the kind's aggregate when that model has
// no data for a currency.
const priceForModel = (price, model, code) =>
  reduce(price.byModel?.[model]?.[code]) ?? price[code];

/**
 * One kind of accessory on a model page: heading with price pills, the
 * editorial blurb (server-rendered, passed as children), and the case cards.
 *
 * With a tab bar the pills always show the active tab's exact price — from
 * first paint, exactly like the old CaseTabsObserver applied the default tab
 * on mount. Without tabs (merged Clear Cases, lone-model kinds) they show the
 * kind's aggregate, rendered as "from $X" when models differ.
 */
export default function KindSectionClient({
  kind,
  slug,
  price,
  entries,
  showTabs,
  children,
}) {
  const [active, setActive] = useState(0);

  const activeModel = showTabs ? entries[active]?.model : null;
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
          {entries.map((entry, index) => (
            <button
              key={entry.model}
              role="tab"
              type="button"
              aria-selected={index === active}
              data-active={index === active}
              className={chrome.tab}
              onClick={(e) => {
                setActive(index);
                e.currentTarget.blur();
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      )}
      {entries.map((entry, index) => (
        <div
          key={entry.model ?? index}
          role="tabpanel"
          hidden={index !== active}
        >
          <VerticalCarouselClient
            cases={entry.cases}
            model={entry.model ?? undefined}
            material={kind}
            standalone={!showTabs}
          />
        </div>
      ))}
    </section>
  );
}
