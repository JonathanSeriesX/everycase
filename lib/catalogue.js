import { getAllCasesFromCSV } from "./getCasesFromCSV.mjs";

// The whole site tree in one place: groups → pages → CSV model names.
// This replaces Nextra's _meta files and the model/material props that were
// previously duplicated inside every MDX page. Everything else (kinds, cards,
// prices, ordering) is derived from the CSV at build time.
//
// A page with an empty `models` list is prose-only (e.g. iPod Socks) and
// renders just its notes file.

export const GROUPS = [
  {
    slug: "iphone",
    title: "iPhone",
    blurb: "Cases, Sleeves, Bumpers",
    pages: [
      {
        slug: "iphone-air",
        title: "iPhone Air",
        models: ["iPhone Air"],
      },
      {
        slug: "iphone-17",
        title: "iPhone 17, Pro, Max",
        models: ["iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max"],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-e",
        title: "iPhone 16e, 17e",
        models: ["iPhone 16e", "iPhone 17e"],
      },
      {
        slug: "iphone-16",
        title: "iPhone 16, Plus, Pro, Max",
        models: [
          "iPhone 16",
          "iPhone 16 Plus",
          "iPhone 16 Pro",
          "iPhone 16 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-15",
        title: "iPhone 15, Plus, Pro, Max",
        models: [
          "iPhone 15",
          "iPhone 15 Plus",
          "iPhone 15 Pro",
          "iPhone 15 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-14",
        title: "iPhone 14, Plus, Pro, Max",
        models: [
          "iPhone 14",
          "iPhone 14 Plus",
          "iPhone 14 Pro",
          "iPhone 14 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-13",
        title: "iPhone 13, mini, Pro, Max",
        models: [
          "iPhone 13",
          "iPhone 13 mini",
          "iPhone 13 Pro",
          "iPhone 13 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-12",
        title: "iPhone 12, mini, Pro, Max",
        models: ["iPhone 12 mini", "iPhone 12 & 12 Pro", "iPhone 12 Pro Max"],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-11",
        title: "iPhone 11 Pro, Max",
        models: ["iPhone 11 Pro", "iPhone 11 Pro Max"],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-xr",
        title: "iPhone XR & 11",
        models: ["iPhone XR", "iPhone 11"],
        merged: ["Clear Case"],
      },
      {
        slug: "iphone-x",
        title: "iPhone X & Xs",
        models: ["iPhone X", "iPhone XS", "iPhone XS Max"],
      },
      {
        slug: "iphone-7",
        title: "iPhone 7, 8, Plus & SE",
        models: ["iPhone 7-8", "iPhone 7-8 Plus"],
        tabLabels: {
          "iPhone 7-8": "iPhone 7 / 8",
          "iPhone 7-8 Plus": "iPhone 7 Plus / 8 Plus",
        },
      },
      {
        slug: "iphone-6",
        title: "iPhone 6, 6s, Plus",
        models: ["iPhone 6-6s", "iPhone 6-6s Plus"],
        tabLabels: {
          "iPhone 6-6s": "iPhone 6 | 6s",
          "iPhone 6-6s Plus": "6 Plus | 6s Plus",
        },
      },
      {
        slug: "iphone-5s",
        title: "iPhone 5, 5s, SE",
        models: ["iPhone 5s-SE"],
      },
      { slug: "iphone-5c", title: "iPhone 5c", models: ["iPhone 5c"] },
      { slug: "iphone-4", title: "iPhone 4, 4s", models: ["iPhone 4"] },
    ],
  },
  {
    slug: "ipad",
    title: "iPad",
    blurb: "Smart Covers, Folios, and keyboards",
    pages: [
      {
        slug: "ipad-pro-2024",
        title: "iPad Pro M4 / M5",
        models: ["iPad Pro 11 M4", "iPad Pro 13 M4"],
        tabLabels: {
          "iPad Pro 11 M4": "iPad Pro 11″",
          "iPad Pro 13 M4": "Pro 13″",
        },
      },
      {
        slug: "ipad-air-2020",
        title: "iPad Air / Pro (2018)",
        models: ["iPad Air 11-inch", "iPad Air 13-inch"],
        tabLabels: {
          "iPad Air 11-inch": "10.9″ | 11″",
          "iPad Air 13-inch": "12.9″ | 13″",
        },
      },
      { slug: "ipad-10", title: "Liquid iPad", models: ["iPad 10"] },
      {
        slug: "ipad-mini-6",
        title: "Liquid iPad mini",
        models: ["iPad mini 6"],
      },
      {
        slug: "ipad-pro-2020",
        title: "iPad Pro A12Z / M1 / M2",
        models: ["iPad Pro 11 M1", "iPad Pro 12.9 M1"],
        tabLabels: {
          "iPad Pro 11 M1": "iPad Pro 11″",
          "iPad Pro 12.9 M1": "Pro 12.9″",
        },
      },
      {
        slug: "ipad-pro-105",
        title: "iPad 10.2″ & Pro 10.5″",
        models: ["iPad 10.5"],
      },
      {
        slug: "ipad-pro-129",
        title: "iPad Pro 12.9″",
        models: ["iPad Pro 12.9 A9X", "iPad Pro 12.9 1-2"],
      },
      { slug: "ipad-pro-97", title: "iPad Pro 9.7″", models: ["iPad Pro 9.7"] },
      {
        slug: "ipad-mini-4",
        title: "iPad mini 4–5",
        models: ["iPad mini 4", "iPad mini 4-5"],
      },
      {
        slug: "ipad-air-2013",
        title: "iPad Air 1–2 & iPad 5–6",
        models: ["iPad 9.7", "iPad 9.7 thicc", "iPad Air 2"],
        tabLabels: {
          "iPad 9.7 thicc": "iPad Air 1",
          "iPad Air 2": "iPad Air 2",
        },
      },
      {
        slug: "ipad-mini-2012",
        title: "iPad Mini 1–3",
        models: ["iPad mini 1-3"],
      },
      { slug: "ipad-2", title: "iPad 2–4", models: ["iPad 2-4"] },
    ],
  },
  {
    slug: "others",
    title: "Others",
    blurb: "Wallets, MacBook sleeves, and more",
    pages: [
      {
        slug: "airtag",
        title: "AirTag",
        blurb: "Loops and Key Rings",
        models: ["AirTag"],
        // Promoted to the home page; hidden from the Others grid (the URL
        // and breadcrumb keep living under /others).
        hidden: true,
      },
      { slug: "wallet", title: "MagSafe Wallet", models: ["MagSafe iPhone"] },
      {
        slug: "crossbody",
        title: "Crossbody Straps",
        models: ["iPhone Gloryhole Case"],
      },
      {
        slug: "macbook",
        title: "MacBook Leather Sleeve",
        models: [
          "MacBook 12",
          "MacBook Pro 13",
          "MacBook Pro 15",
          "MacBook Pro 16",
        ],
        tabLabels: {
          "MacBook 12": "MacBook 12″",
          "MacBook Pro 13": "Air & Pro 13″",
          "MacBook Pro 15": "Pro 15″",
          "MacBook Pro 16": "Pro 16″",
        },
      },
      { slug: "pencil", title: "Apple Pencil", models: ["Apple Pencil"] },
      { slug: "ipod-touch", title: "iPod Touch Loop", models: ["iPod touch"] },
      { slug: "ipod-socks", title: "iPod Socks", models: [] },
    ],
  },
];

// What the front page shows, in order: group cards and promoted pages.
export const HOME_CARDS = [
  { group: "iphone" },
  { group: "ipad" },
  { group: "others", page: "airtag" },
  { group: "others" },
];

// Editorial ordering for kind sections on a page; kinds not listed here sort
// after the listed ones, alphabetically.
const KIND_ORDER = [
  "Case",
  "Silicone Case",
  "Clear Case",
  "FineWoven Case",
  "TechWoven Case",
  "Beats Case",
  "Beats Kickstand Case",
  "Beats Rugged Case",
  "Leather Case",
  "Leather Sleeve",
  "Leather Folio",
  "Smart Battery Case",
  "Bumper",
  "Smart Case",
  "Smart Cover",
  "Leather Smart Cover",
  "Polyurethane Smart Cover",
  "Smart Folio",
  "Smart Keyboard",
  "Smart Keyboard Folio",
  "Magic Keyboard",
  "Magic Keyboard Folio",
  "Pencil Case",
  "FineWoven Wallet",
  "Leather Wallet",
  "Crossbody Strap",
  "FineWoven Key Ring",
  "Leather Key Ring",
  "Leather Loop",
  "Silicone Loop",
  "Loop",
];

const kindRank = new Map(KIND_ORDER.map((kind, index) => [kind, index]));

// Seasons are written as "<Season|Month> <Year>". Map the leading word to a
// representative month so releases order chronologically.
const SEASON_MONTH = {
  spring: 3,
  summer: 6,
  autumn: 9,
  fall: 9,
  winter: 12,
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export function seasonSortKey(season) {
  const match = String(season || "")
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\s+(\d{4})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const month = SEASON_MONTH[match[1]] ?? 6;
  return parseInt(match[2], 10) * 100 + month;
}

// Oldest → newest by season, then colour, then SKU for build-stable ordering.
export function sortCases(caseList = []) {
  return [...caseList].sort((a, b) => {
    const seasonDelta = seasonSortKey(a?.season) - seasonSortKey(b?.season);
    if (seasonDelta !== 0) return seasonDelta;
    const colourDelta = (a?.colour || "").localeCompare(b?.colour || "");
    if (colourDelta !== 0) return colourDelta;
    return (a?.SKU || "").localeCompare(b?.SKU || "");
  });
}

let cachedRows;
function rows() {
  if (!cachedRows) {
    cachedRows = getAllCasesFromCSV().map((record) => ({
      ...record,
      SKU: (record.SKU || "").trim(),
      colour: (record.colour || "").trim(),
      kind: (record.kind || "").trim(),
      model: (record.model || "").trim(),
      season: (record.season || "").trim(),
    }));
    validate(cachedRows);
  }
  return cachedRows;
}

// Fail the build loudly if the config drifts from the CSV.
function validate(allRows) {
  const known = new Set(allRows.map((row) => row.model));
  for (const group of GROUPS) {
    for (const page of group.pages) {
      for (const model of page.models) {
        if (!known.has(model)) {
          throw new Error(
            `catalogue: page "${group.slug}/${page.slug}" references model "${model}" not present in database.csv`,
          );
        }
      }
    }
  }
}

export function getGroup(slug) {
  return GROUPS.find((group) => group.slug === slug);
}

export function getPage(groupSlug, pageSlug) {
  return getGroup(groupSlug)?.pages.find((page) => page.slug === pageSlug);
}

const asAmount = (raw) => {
  const amount = Number(String(raw || "").trim());
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

// Reduces a set of distinct amounts to what the heading shows: the lowest
// price, flagged `multiple` when models differ (rendered as "from $X").
const reduceAmounts = (amounts) => {
  if (amounts.size === 0) return null;
  const values = [...amounts];
  return { value: Math.min(...values), multiple: values.length > 1 };
};

/**
 * Everything a model page needs, derived from the CSV: one entry per kind
 * (in editorial order), each carrying its cases grouped per model and an
 * aggregate price. All computed server-side at build time.
 */
export function getPageSections(page) {
  const wanted = new Set(page.models);
  const byKind = new Map();

  for (const row of rows()) {
    if (!wanted.has(row.model) || !row.kind) continue;
    let bucket = byKind.get(row.kind);
    if (!bucket) {
      bucket = {
        kind: row.kind,
        cases: [],
        prices: { USD: new Set(), EUR: new Set(), GBP: new Set() },
        pricesByModel: new Map(),
      };
      byKind.set(row.kind, bucket);
    }
    bucket.cases.push(row);
    let perModel = bucket.pricesByModel.get(row.model);
    if (!perModel) {
      perModel = { USD: new Set(), EUR: new Set(), GBP: new Set() };
      bucket.pricesByModel.set(row.model, perModel);
    }
    for (const [code, raw] of [
      ["USD", row.MSRP],
      ["EUR", row.MSRP_EUR],
      ["GBP", row.MSRP_GBP],
    ]) {
      const amount = asAmount(raw);
      if (amount) {
        bucket.prices[code].add(amount);
        perModel[code].add(amount);
      }
    }
  }

  return [...byKind.values()]
    .sort((a, b) => {
      const rankA = kindRank.get(a.kind) ?? KIND_ORDER.length;
      const rankB = kindRank.get(b.kind) ?? KIND_ORDER.length;
      return rankA - rankB || a.kind.localeCompare(b.kind);
    })
    .map((bucket) => {
      // Keep the page's model order, not CSV row order, for the tabs.
      const byModel = new Map(page.models.map((model) => [model, []]));
      for (const row of bucket.cases) byModel.get(row.model).push(row);
      const byModelPrices = {};
      for (const [model, perModel] of bucket.pricesByModel) {
        byModelPrices[model] = {
          USD: [...perModel.USD],
          EUR: [...perModel.EUR],
          GBP: [...perModel.GBP],
        };
      }
      // Merged kinds (e.g. Clear Case) render as one combined grid with no
      // tabs — the cards' labels show the model names instead of colours.
      const merged = page.merged?.includes(bucket.kind);
      return {
        kind: bucket.kind,
        merged: Boolean(merged),
        models: merged
          ? [{ model: null, cases: sortCases(bucket.cases) }]
          : [...byModel.entries()]
              .filter(([, cases]) => cases.length > 0)
              .map(([model, cases]) => ({ model, cases: sortCases(cases) })),
        // Aggregate across the page's models ("from $X" when they differ)
        // plus the raw per-model amounts, so the heading can switch to an
        // exact price when the reader picks a tab.
        price: {
          USD: reduceAmounts(bucket.prices.USD),
          EUR: reduceAmounts(bucket.prices.EUR),
          GBP: reduceAmounts(bucket.prices.GBP),
          byModel: byModelPrices,
        },
      };
    });
}

// The image shown on a group/model navigation card: the newest case of the
// page's leading kind (override per page with `hero: "<SKU>"` if desired).
export function getHeroCase(page) {
  if (page.hero) {
    const match = rows().find((row) => row.SKU === page.hero);
    if (match) return match;
  }
  const sections = getPageSections(page);
  if (sections.length === 0) return null;
  const cases = sections[0].models.flatMap((entry) => entry.cases);
  return cases.reduce(
    (best, row) =>
      !best || seasonSortKey(row.season) >= seasonSortKey(best.season)
        ? row
        : best,
    null,
  );
}

// Where a case lives in the drill-down: the first page whose model list
// contains the case's model. Used for case-page breadcrumbs.
export function findPageForModel(model) {
  for (const group of GROUPS) {
    for (const page of group.pages) {
      if (page.models.includes(model)) return { group, page };
    }
  }
  return null;
}

export function getGroupHeroCase(group) {
  for (const page of group.pages) {
    if (page.hidden) continue; // promoted pages have their own card
    const hero = getHeroCase(page);
    if (hero) return hero;
  }
  return null;
}
