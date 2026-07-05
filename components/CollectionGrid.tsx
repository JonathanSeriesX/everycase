import Link from "next/link";
import type { CaseRecord } from "../lib/getCasesFromCSV";
import { CURRENCIES, type Currency } from "../lib/currencies";
import { getCaseName } from "../lib/caseName";
import CaseImage from "./CaseImage.client";
import carousel from "../styles/VerticalCarousel.module.css";

/** The owned/wishlist card grid, shared by /collection and /collections/[username]. */
export function CaseGrid({ cases }: { cases: CaseRecord[] }) {
  return (
    <div className={carousel.cardTrack}>
      {cases.map((item) => {
        const name = getCaseName(item);
        return (
          <article key={item.SKU} className={carousel.caseCard}>
            <Link
              href={`/case/${item.SKU}`}
              className={carousel.cardLink}
              aria-label={name}
            >
              <div className={carousel.imageShell}>
                <CaseImage
                  code={(item.alt_thumbnail || item.SKU).trim()}
                  alt={name}
                />
              </div>
              <strong className={`${carousel.caseTitle} ${carousel.linkTitle}`}>
                {name}
              </strong>
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export interface LaunchValue {
  sums: Partial<Record<Currency, number>>;
  /** Cases with a known USD launch price. */
  pricedCount: number;
}

export function computeLaunchValue(cases: CaseRecord[]): LaunchValue {
  const sums: Partial<Record<Currency, number>> = {};
  let pricedCount = 0;
  for (const item of cases) {
    if (item.prices.USD) pricedCount += 1;
    for (const code of CURRENCIES) {
      const amount = Number(item.prices[code]);
      if (item.prices[code] && Number.isFinite(amount)) {
        sums[code] = (sums[code] ?? 0) + amount;
      }
    }
  }
  return { sums, pricedCount };
}
