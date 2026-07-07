"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { formatPrice, type Currency } from "../lib/currencies";
import { useCurrency } from "../lib/useCurrency";
import VerticalCarouselClient from "./VerticalCarousel.client";
import HeadingAnchor from "./HeadingAnchor";
import type { CaseRecord } from "../lib/getCasesFromCSV";
import type { PriceSummary, SectionPrice } from "../lib/catalogue";
import headingStyles from "../styles/SectionHeading.module.css";
import chrome from "../styles/Chrome.module.css";

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
): PriceSummary | null =>
  reduce(price.byModel?.[model]?.[code]) ?? price.byCurrency[code];

interface KindSectionClientProps {
  kind: string;
  slug: string;
  price: SectionPrice;
  /** `model` and `label` are null for merged sections (single grid, no tabs). */
  entries: { model: string | null; label: string | null; cases: CaseRecord[] }[];
  showTabs: boolean;
  /** One combined grid across models (Clear Cases, iPhone Dock). */
  merged: boolean;
  /** Display overrides for model names on merged cards (page.tabLabels). */
  modelLabels?: Record<string, string>;
  children?: ReactNode;
}

// Sections follow each other's tabs: picking "iPhone 17 Pro" under Silicone
// Case switches every other section that has an "iPhone 17 Pro" tab too
// (matched by label, not index — tab sets differ between kinds). Sections
// without that label stay put.
const TAB_SYNC_EVENT = "finestwoven:model-tab";

// Because every section follows one model, a page only needs to remember a
// single active model label. It is shared across pages: a family that has the
// same model (e.g. "iPhone XS Max" on both /iphone/x and /iphone/xs) restores
// it, and any page without that label simply keeps its default tab.
const TAB_STORAGE_KEY = "finestwoven:model-tab";

const readStoredModel = (): string | null => {
  try {
    return window.localStorage.getItem(TAB_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeModel = (label: string): void => {
  try {
    window.localStorage.setItem(TAB_STORAGE_KEY, label);
  } catch {
    // Ignore private-mode / disabled-storage failures.
  }
};

// Scroll compensation must run before the browser paints the taller layout, so
// prefer useLayoutEffect on the client and fall back to useEffect during SSR
// (where it would otherwise warn and do nothing).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  merged,
  modelLabels,
  children,
}: KindSectionClientProps) {
  const [active, setActive] = useState(0);
  const tabListRef = useRef<HTMLDivElement>(null);
  // When the reader switches tabs, sections *above* the clicked one may grow
  // or shrink (different models carry different accessory counts), which would
  // otherwise shove the clicked control up or down the viewport. We record the
  // tab bar's position at click time and scroll by the delta once the new
  // layout commits, pinning the clicked section in place.
  const scrollAnchorTop = useRef<number | null>(null);
  // Panels whose images may load. Hidden panels start out deferred
  // (loading="lazy" inside hidden subtrees fetches nothing) so the visible
  // grid — and the LCP image — never share bandwidth with them; they queue
  // up behind everything else instead of being skipped: once the page has
  // finished loading (or the reader opens a tab early) they flip to eager
  // and download at low priority.
  const [activated, setActivated] = useState<number[]>([0]);

  const panelCount = entries.length;
  useEffect(() => {
    const activateAll = () =>
      setActivated(Array.from({ length: panelCount }, (_, index) => index));
    if (document.readyState === "complete") {
      activateAll();
      return;
    }
    window.addEventListener("load", activateAll, { once: true });
    return () => window.removeEventListener("load", activateAll);
  }, [panelCount]);

  // Restore the reader's last active model from a previous visit. Runs after
  // hydration so server and first client render still agree on the default
  // tab — which is exactly why the setState must live in this effect: lazy
  // state initialisation would desync the hydration pass.
  useEffect(() => {
    if (!showTabs) return;
    const stored = readStoredModel();
    if (!stored) return;
    const index = entries.findIndex((entry) => entry.label === stored);
    if (index < 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration restore from localStorage, not a render-cascading sync
    setActive(index);
    setActivated((seen) => (seen.includes(index) ? seen : [...seen, index]));
  }, [entries, showTabs]);

  // Compensate the scroll position after a tab switch this section initiated.
  useIsomorphicLayoutEffect(() => {
    if (scrollAnchorTop.current === null) return;
    const node = tabListRef.current;
    if (node) {
      const delta = node.getBoundingClientRect().top - scrollAnchorTop.current;
      if (delta !== 0) window.scrollBy(0, delta);
    }
    scrollAnchorTop.current = null;
  }, [active]);

  // Follow tab changes made in other sections (see TAB_SYNC_EVENT).
  useEffect(() => {
    if (!showTabs) return;
    const onSync = (event: Event) => {
      const label = (event as CustomEvent<string>).detail;
      const index = entries.findIndex((entry) => entry.label === label);
      if (index < 0) return;
      setActive(index);
      setActivated((seen) => (seen.includes(index) ? seen : [...seen, index]));
    };
    window.addEventListener(TAB_SYNC_EVENT, onSync);
    return () => window.removeEventListener(TAB_SYNC_EVENT, onSync);
  }, [entries, showTabs]);

  // USD always leads; the second pill follows the footer's currency choice.
  const secondary = useCurrency();
  const activeModel = showTabs ? entries[active]?.model : null;
  const pills = (["USD", secondary] as Currency[]).flatMap((code) => {
    const entry = activeModel
      ? priceForModel(price, activeModel, code)
      : price.byCurrency[code];
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
          <HeadingAnchor id={slug} title={kind} />
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
          ref={tabListRef}
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
                if (index !== active) {
                  scrollAnchorTop.current =
                    tabListRef.current?.getBoundingClientRect().top ?? null;
                }
                setActive(index);
                setActivated((seen) =>
                  seen.includes(index) ? seen : [...seen, index],
                );
                if (entry.label) {
                  storeModel(entry.label);
                  window.dispatchEvent(
                    new CustomEvent(TAB_SYNC_EVENT, { detail: entry.label }),
                  );
                }
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
            merged={merged}
            modelLabels={modelLabels}
            standalone={!showTabs}
            primary={index === 0}
            activated={activated.includes(index)}
          />
        </div>
      ))}
    </section>
  );
}
