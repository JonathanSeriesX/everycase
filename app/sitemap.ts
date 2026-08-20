import type { MetadataRoute } from "next";
import { GROUPS, TOP_PAGES, type CataloguePage } from "../lib/catalogue";
import { getAliasedSkus, getAllCasesFromCSV } from "../lib/getCasesFromCSV";
import { getReleaseDateIso } from "../lib/releaseDates";
import { SITE_URL } from "../lib/siteUrl";

// Every indexable URL, built from the same two sources the routes are built
// from — the catalogue tree for the group/model pages, the CSV for the ~1,300
// case pages — so a new catalogue row lands in the sitemap the moment its
// page exists. No request-time APIs here, so this stays a fully cached route
// regenerated with the deployment, like the pages it lists.
//
// Deliberately absent:
//   /collection, /settings          — per-signed-in-user, already noindex
//   /collections/<username>         — public but user-owned; enumerating them
//                                     means a DB read, and they come and go
//   merged keyboard sibling SKUs    — those 301 to their primary case page
//                                     (see getAltSkuRedirects in next.config)

// <lastmod> is the release date of the newest case on the page: the catalogue
// is historical, so a page's content changes when a case is added to it, not
// on every deploy. Build timestamps here would tell crawlers all 1,300 pages
// changed at once, which is both untrue and the fastest way to have lastmod
// ignored altogether.
const newer = (a: string, b: string): string => (a > b ? a : b);

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  lastModified: string,
  changeFrequency: NonNullable<SitemapEntry["changeFrequency"]>,
  priority: number,
): SitemapEntry {
  return {
    url: `${SITE_URL}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Same selection as the case route's generateStaticParams: first row wins
  // on SKU collisions, and rows merged into another SKU's page are skipped.
  const aliased = getAliasedSkus();
  const seen = new Set<string>();
  const cases: { sku: string; model: string; kind: string; date: string }[] = [];

  for (const record of getAllCasesFromCSV()) {
    const sku = record.SKU;
    if (!sku || seen.has(sku) || aliased.has(sku)) continue;
    seen.add(sku);
    cases.push({
      sku,
      model: record.model,
      kind: record.kind,
      // A re-release changes its case page (the alt SKU and date render on
      // it), so lastmod is the later of the two launches. Alt dates live in
      // the same lookup, keyed by the alt SKU.
      date: newer(
        getReleaseDateIso(sku),
        record.alt_sku ? getReleaseDateIso(record.alt_sku) : "",
      ),
    });
  }

  // A model page shows the cases matching its models (narrowed by `kinds`
  // where it sets them) — the same filter getPageSections applies.
  const pageDate = (page: CataloguePage): string => {
    const models = new Set(page.models);
    const kinds = page.kinds ? new Set(page.kinds) : null;
    let latest = "";
    for (const item of cases) {
      if (!models.has(item.model)) continue;
      if (kinds && !kinds.has(item.kind)) continue;
      latest = newer(latest, item.date);
    }
    return latest;
  };

  const catalogue = GROUPS.flatMap((group) => {
    const dates = group.pages.map(pageDate);
    return [
      entry(`/${group.slug}`, dates.reduce(newer, ""), "monthly", 0.8),
      ...group.pages.map((page, index) =>
        entry(`/${group.slug}/${page.slug}`, dates[index], "monthly", 0.7),
      ),
    ];
  });

  // Top-level catalogue pages (/airtag, …) live on the [group] segment.
  const topPages = TOP_PAGES.map((page) =>
    entry(`/${page.slug}`, pageDate(page), "monthly", 0.8),
  );

  const casePages = cases.map((item) =>
    entry(`/case/${item.sku}`, item.date, "yearly", 0.5),
  );

  const newestCase = cases.reduce((latest, item) => newer(latest, item.date), "");

  return [
    entry("", newestCase, "weekly", 1),
    ...catalogue,
    ...topPages,
    ...casePages,
    entry("/about", "", "yearly", 0.3),
    entry("/contact", "", "yearly", 0.3),
    entry("/support", "", "yearly", 0.3),
  ];
}
