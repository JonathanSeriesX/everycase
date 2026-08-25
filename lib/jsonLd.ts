import type { Crumb } from "../components/Breadcrumb";
import { CURRENCIES } from "./currencies";
import { getCaseName } from "./caseName";
import type { CaseRecord } from "./getCasesFromCSV";
import { getReleaseDateIso } from "./releaseDates";
import { SITE_URL } from "./siteUrl";

// Structured-data builders for the JSON-LD script tags (see
// components/JsonLd.tsx). Kept as plain object literals — no schema library —
// because the site only ever emits two shapes.

/** schema.org BreadcrumbList mirroring the visible breadcrumb trail. */
export function breadcrumbJsonLd(trail: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.title,
      item: `${SITE_URL}${crumb.href}`,
    })),
  };
}

/** schema.org Product for a case page. Prices are launch MSRPs — most of the
 *  catalogue is long discontinued, so they're emitted as plain price/currency
 *  pairs with no availability claim. */
export function productJsonLd(data: CaseRecord, imageUrls: string[]) {
  const url = `${SITE_URL}/case/${data.SKU}`;
  const releaseDate = getReleaseDateIso(data.SKU);
  const offers = CURRENCIES.filter((code) => data.prices[code]).map((code) => ({
    "@type": "Offer",
    price: data.prices[code],
    priceCurrency: code,
    url,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: getCaseName(data),
    sku: data.SKU,
    mpn: data.SKU,
    url,
    brand: { "@type": "Brand", name: "Apple" },
    ...(data.colour && { color: data.colour }),
    ...(releaseDate && { releaseDate }),
    ...(imageUrls.length > 0 && { image: imageUrls }),
    ...(offers.length > 0 && { offers }),
  };
}
