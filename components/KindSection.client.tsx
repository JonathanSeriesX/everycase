"use client";

import { useState, type ReactNode } from "react";
import { formatPrice } from "../lib/productRegions";
import VerticalCarouselClient from "./VerticalCarousel.client";
import type { CaseRecord } from "../lib/getCasesFromCSV";
import type { Currency, PriceSummary, SectionPrice } from "../lib/catalogue";
import headingStyles from "../styles/SectionHeading.module.css";
import chrome from "../styles/Chrome.module.css";

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP"];

// Reduces a list of amounts to {value, multiple}, or null when empty.
const reduce = (amounts?: number[]): PriceSummary | null =>
  !amounts || amounts.length === 0
    ? null
    : { value: Math.min(...amounts), multiple: new Set(amounts).size > 1 };

// Price for a model, falling back to the kind's aggregate when that model has
// no data for a currency.
const priceForModel = (
  price: SectionPrice,
  model: string,
  code: Currency,
): PriceSummary | null => reduce(price.byModel?.[model]?.[code]) ?? price[code];

interface KindSectionClientProps {
  kind: string;
  slug: string;
  price: SectionPrice;
  /** `model` and `label` are null for merged sections (single grid, no tabs). */
  entries: { model: string | null; label: string | null; cases: CaseRecord[] }[];
  showTabs: boolean;
  children?: ReactNode;
}

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
}: KindSectionClientProps) {
  const [active, setActive] = useState(0);
  // Tabs the reader has opened at least once. Images in never-visited panels
  // stay unfetched (loading="lazy" inside hidden subtrees loads nothing);
  // visiting a tab flips its panel to eager so it loads in one go.
  const [visited, setVisited] = useState<number[]>([0]);

  const activeModel = showTabs ? entries[active]?.model : null;
  const pills = CURRENCIES.flatMap((code) => {
    const entry = activeModel
      ? priceForModel(price, activeModel, code)
      : price[code];
    if (!entry) return [];
    const formatted = formatPrice(entry.value, code);
    if (!formatted) return [];
    return {
      code,
      label: entry.multiple ? `from ${formatted}` : formatted,
    };
  });

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
                setVisited((seen) =>
                  seen.includes(index) ? seen : [...seen, index],
                );
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
            primary={index === 0}
            activated={visited.includes(index)}
          />
        </div>
      ))}
    </section>
  );
}
