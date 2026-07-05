import { getAllCasesFromCSV, type CaseRecord } from "./getCasesFromCSV";
import { CURRENCIES, type Currency } from "./currencies";

// The whole site tree in one place: groups → pages → CSV model names.
// This replaces Nextra's _meta files and the model/material props that were
// previously duplicated inside every MDX page. Everything else (kinds, cards,
// prices, ordering) is derived from the CSV at build time.
//
// A page with an empty `models` list is prose-only (e.g. iPod Socks) and
// renders just its notes file.

export interface CataloguePage {
  slug: string;
  title: string;
  /** Short line under the title on navigation cards. */
  blurb?: string;
  /** Pin the card artwork: a SKU or any everypreview image code. */
  hero?: string;
  /** Full image URL override for the card artwork. */
  image?: string;
  /** CSV model names shown on this page; empty = prose-only page. */
  models: string[];
  /** Kinds rendered as one combined grid with no tabs (e.g. Clear Case). */
  merged?: string[];
  /** Overrides for tab captions, keyed by CSV model name. */
  tabLabels?: Record<string, string>;
}

export interface CatalogueGroup {
  slug: string;
  title: string;
  blurb?: string;
  hero?: string;
  image?: string;
  pages: CataloguePage[];
}

export const GROUPS: CatalogueGroup[] = [
  {
    slug: "iphone",
    title: "iPhone",
    blurb: "Cases, Sleeves, Bumpers",
    hero: "MM163_AV4",
    pages: [
      {
        slug: "air",
        title: "iPhone Air",
        blurb: "Cases & Bumpers",
        hero: "MH024",
        models: ["iPhone Air"],
      },
      {
        slug: "17",
        title: "iPhone 17, Pro, Max",
        hero: "MGFJ4",
        blurb: "Silicone & TechWoven",
        models: ["iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max"],
        merged: ["Clear Case"],
      },
      {
        slug: "e",
        title: "iPhone 16e, 17e",
        hero: "MHWF4_AV1",
        blurb: "Silicone & Clear",
        models: ["iPhone 16e", "iPhone 17e"],
      },
      {
        slug: "16",
        title: "iPhone 16, Plus, Pro, Max",
        hero: "MDGQ4",
        blurb: "Silicone & Clear",
        models: [
          "iPhone 16",
          "iPhone 16 Plus",
          "iPhone 16 Pro",
          "iPhone 16 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "15",
        title: "iPhone 15, Plus, Pro, Max",
        hero: "MT0V3_AV1",
        blurb: "Silicone & FineWoven",
        models: [
          "iPhone 15",
          "iPhone 15 Plus",
          "iPhone 15 Pro",
          "iPhone 15 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "14",
        title: "iPhone 14, Plus, Pro, Max",
        blurb: "Silicone & Leather",
        hero: "MPP83_AV1",
        models: [
          "iPhone 14",
          "iPhone 14 Plus",
          "iPhone 14 Pro",
          "iPhone 14 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "13",
        title: "iPhone 13, mini, Pro, Max",
        hero: "MM163_AV4",
        blurb: "Silicone & Leather",
        models: [
          "iPhone 13",
          "iPhone 13 mini",
          "iPhone 13 Pro",
          "iPhone 13 Pro Max",
        ],
        merged: ["Clear Case"],
      },
      {
        slug: "12",
        title: "iPhone 12, mini, Pro, Max",
        blurb: "Silicone, Leather & Sleeves",
        hero: "MHKQ3",
        models: ["iPhone 12 mini", "iPhone 12 & 12 Pro", "iPhone 12 Pro Max"],
        merged: ["Clear Case"],
      },
      {
        slug: "11",
        title: "iPhone 11 Pro, Max",
        blurb: "Silicone, Leather & Folios",
        hero: "MWYA2_AV2",
        models: ["iPhone 11 Pro", "iPhone 11 Pro Max"],
        merged: ["Clear Case"],
      },
      {
        slug: "xr",
        title: "iPhone XR & 11",
        blurb: "Silicone & Battery Cases",
        hero: "MY182_AV4",
        models: ["iPhone XR", "iPhone 11"],
        merged: ["Clear Case"],
      },
      {
        slug: "x",
        title: "iPhone X & Xs",
        blurb: "Silicone, Leather & Folios",
        hero: "MQTJ2",
        models: ["iPhone X", "iPhone XS", "iPhone XS Max"],
      },
      {
        slug: "7",
        title: "iPhone 7, 8, Plus & SE",
        blurb: "Silicone, Leather & Battery",
        hero: "MQ5F2",
        models: ["iPhone 7-8", "iPhone 7-8 Plus"],
        tabLabels: {
          "iPhone 7-8": "iPhone 7 / 8",
          "iPhone 7-8 Plus": "iPhone 7 Plus / 8 Plus",
        },
      },
      {
        slug: "6",
        title: "iPhone 6, 6s, Plus",
        blurb: "Silicone, Leather & Battery",
        hero: "MM682",
        models: ["iPhone 6-6s", "iPhone 6-6s Plus"],
        tabLabels: {
          "iPhone 6-6s": "iPhone 6 | 6s",
          "iPhone 6-6s Plus": "6 Plus | 6s Plus",
        },
      },
      {
        slug: "5s",
        title: "iPhone 5, 5s, SE",
        blurb: "Leather Case",
        hero: "MF044",
        models: ["iPhone 5s-SE"],
      },
      {
        slug: "5c",
        title: "iPhone 5c",
        hero: "MF036",
        blurb: "Silicone Case",
        models: ["iPhone 5c"],
      },
      {
        slug: "4",
        title: "iPhone 4, 4s",
        hero: "MC671",
        blurb: "Bumpers",
        models: ["iPhone 4"],
      },
    ],
  },
  {
    slug: "ipad",
    title: "iPad",
    blurb: "Smart Covers, Folios, and keyboards",
    hero: "MJM23_AV4",
    pages: [
      {
        slug: "pro-2024",
        title: "iPad Pro M4 / M5",
        blurb: "Folios & keyboards",
        hero: "MW993_AV1",
        models: ["iPad Pro 11 M4", "iPad Pro 13 M4"],
        tabLabels: {
          "iPad Pro 11 M4": "iPad Pro 11″",
          "iPad Pro 13 M4": "Pro 13″",
        },
      },
      {
        slug: "air-2020",
        title: "iPad Air / Pro (2018)",
        blurb: "Folios & keyboards",
        hero: "MRX92_AV4",
        models: ["iPad Air 11-inch", "iPad Air 13-inch"],
        tabLabels: {
          "iPad Air 11-inch": "10.9″ | 11″",
          "iPad Air 13-inch": "12.9″ | 13″",
        },
      },
      {
        slug: "10",
        title: "Liquid iPad",
        blurb: "Folios & keyboards",
        hero: "MDEN4_AV1",
        models: ["iPad 10"],
      },
      {
        slug: "mini-6",
        title: "Liquid iPad mini",
        blurb: "Smart Folio",
        hero: "MC2V4_AV1",
        models: ["iPad mini 6"],
      },
      {
        slug: "pro-2020",
        title: "iPad Pro A12Z / M1 / M2",
        blurb: "Folios & keyboards",
        hero: "MXT62_AV4",
        models: ["iPad Pro 11 M1", "iPad Pro 12.9 M1"],
        tabLabels: {
          "iPad Pro 11 M1": "iPad Pro 11″",
          "iPad Pro 12.9 M1": "Pro 12.9″",
        },
      },
      {
        slug: "pro-105",
        title: "iPad 10.2″ & Pro 10.5″",
        blurb: "Covers, sleeves & keyboards",
        hero: "MR5K2_AV1_GOLD",
        models: ["iPad 10.5"],
      },
      {
        slug: "pro-129",
        title: "iPad Pro 12.9″",
        blurb: "Cases, covers, sleeves, and keyboards",
        hero: "MPV12_AV1_SILVER",
        models: ["iPad Pro 12.9 A9X", "iPad Pro 12.9 1-2"],
      },
      {
        slug: "pro-97",
        title: "iPad Pro 9.7″",
        blurb: "Cases, covers & keyboards",
        hero: "MMG72",
        models: ["iPad Pro 9.7"],
      },
      {
        slug: "mini-4",
        title: "iPad mini 4–5",
        blurb: "Cases & covers",
        hero: "MM3N2",
        models: ["iPad mini 4", "iPad mini 4-5"],
      },
      {
        slug: "air-2013",
        title: "iPad Air 1–2 & iPad 5–6",
        blurb: "Smart Covers & Cases",
        hero: "MGTT2",
        models: ["iPad 9.7", "iPad 9.7 thicc", "iPad Air 2"],
        tabLabels: {
          "iPad 9.7 thicc": "iPad Air 1",
          "iPad Air 2": "iPad Air 2",
        },
      },
      {
        slug: "mini-2012",
        title: "iPad Mini 1–3",
        blurb: "Smart Covers & Cases",
        hero: "ME709",
        models: ["iPad mini 1-3"],
      },
      {
        slug: "2",
        title: "iPad 2–4",
        blurb: "Smart Covers & Cases",
        models: ["iPad 2-4"],
      },
    ],
  },
  {
    slug: "others",
    title: "Others",
    blurb: "Wallets, MacBook sleeves, and more",
    pages: [
      {
        slug: "wallet",
        title: "MagSafe Wallet",
        hero: "MHLP3",
        models: ["MagSafe iPhone"],
      },
      {
        slug: "crossbody",
        title: "Crossbody Straps",
        models: ["iPhone Gloryhole Case"],
      },
      {
        slug: "magsafe",
        title: "MagSafe Charging",
        blurb: "Chargers & Battery Packs",
        hero: "MGD74",
        models: ["MagSafe Charging"],
      },
      {
        slug: "docks",
        title: "Docking Stations",
        blurb: "iPhone Lightning Docks",
        hero: "ML8H2",
        models: ["iPhone 5s Dock", "iPhone 5c Dock", "Dock"],
        // The 5s and 5c docks are one white cradle each, so combine them into
        // a single grid labelled by model, exactly like Clear Cases.
        merged: ["iPhone Dock"],
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
      { slug: "ipod-accessories", title: "iPod Accessories", models: [] },
    ],
  },
];

// Pages that live directly under Home, served at /<slug> — peers of the
// groups, with a Home > Title breadcrumb.
export const TOP_PAGES: CataloguePage[] = [
  {
    slug: "airtag",
    title: "AirTag",
    blurb: "Loops and Key Rings",
    hero: "MT2M3",
    models: ["AirTag"],
  },
];

// What the front page shows, in order: group cards and top-level pages.
export type HomeCard =
  | { group: string; page?: undefined }
  | { group?: string; page: string };

export const HOME_CARDS: HomeCard[] = [
  { group: "iphone" },
  { group: "ipad" },
  { page: "airtag" },
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
  "MagSafe Charger",
  "MagSafe Duo Charger",
  "MagSafe Battery Pack",
  "iPhone Air MagSafe Battery",
  "iPhone Dock",
  "iPhone Lightning Dock",
];

const kindRank = new Map(KIND_ORDER.map((kind, index) => [kind, index]));

// Seasons are written as "<Season|Month> <Year>". Map the leading word to a
// representative month so releases order chronologically.
const SEASON_MONTH: Record<string, number> = {
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

export function seasonSortKey(season: string | undefined): number {
  const match = String(season || "")
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\s+(\d{4})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const month = SEASON_MONTH[match[1]] ?? 6;
  return parseInt(match[2], 10) * 100 + month;
}

// Oldest → newest by season, then colour, then SKU for build-stable ordering.
export function sortCases(caseList: CaseRecord[] = []): CaseRecord[] {
  return [...caseList].sort((a, b) => {
    const seasonDelta = seasonSortKey(a?.season) - seasonSortKey(b?.season);
    if (seasonDelta !== 0) return seasonDelta;
    const colourDelta = (a?.colour || "").localeCompare(b?.colour || "");
    if (colourDelta !== 0) return colourDelta;
    return (a?.SKU || "").localeCompare(b?.SKU || "");
  });
}

// Fail the build loudly if the config drifts from the CSV.
function validate(allRows: CaseRecord[]): void {
  const known = new Set(allRows.map((row) => row.model));
  const pages = [
    ...GROUPS.flatMap((group) =>
      group.pages.map((page) => ({ path: `${group.slug}/${page.slug}`, page })),
    ),
    ...TOP_PAGES.map((page) => ({ path: page.slug, page })),
  ];
  for (const { path, page } of pages) {
    for (const model of page.models) {
      if (!known.has(model)) {
        throw new Error(
          `catalogue: page "${path}" references model "${model}" not present in database.csv`,
        );
      }
    }
  }
}

// Rows come pre-trimmed from getCasesFromCSV; we only validate them once.
let validated = false;
function rows(): CaseRecord[] {
  const all = getAllCasesFromCSV();
  if (!validated) {
    validate(all);
    validated = true;
  }
  return all;
}

export function getGroup(slug: string): CatalogueGroup | undefined {
  return GROUPS.find((group) => group.slug === slug);
}

export function getTopPage(slug: string): CataloguePage | undefined {
  return TOP_PAGES.find((page) => page.slug === slug);
}

export function getPage(
  groupSlug: string,
  pageSlug: string,
): CataloguePage | undefined {
  return getGroup(groupSlug)?.pages.find((page) => page.slug === pageSlug);
}

export type { Currency };

/** The lowest price of a set, flagged `multiple` when rendered as "from $X". */
export interface PriceSummary {
  value: number;
  multiple: boolean;
}

export interface SectionPrice {
  /** Aggregate per currency across the page's models. */
  byCurrency: Record<Currency, PriceSummary | null>;
  /** Raw per-model amounts so the heading can react to the active tab. */
  byModel: Record<string, Record<Currency, number[]>>;
}

export interface PageSection {
  kind: string;
  merged: boolean;
  /** `model` is null for merged sections (one combined grid, no tabs). */
  models: { model: string | null; cases: CaseRecord[] }[];
  price: SectionPrice;
}

const asAmount = (raw: string | undefined): number | null => {
  const amount = Number(String(raw || "").trim());
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

// Reduces a set of distinct amounts to what the heading shows: the lowest
// price, flagged `multiple` when models differ (rendered as "from $X").
const reduceAmounts = (amounts: Set<number>): PriceSummary | null => {
  if (amounts.size === 0) return null;
  const values = [...amounts];
  return { value: Math.min(...values), multiple: values.length > 1 };
};

type AmountsByCurrency = Record<Currency, Set<number>>;

const newAmounts = (): AmountsByCurrency =>
  Object.fromEntries(
    CURRENCIES.map((code) => [code, new Set<number>()]),
  ) as AmountsByCurrency;

interface KindBucket {
  kind: string;
  cases: CaseRecord[];
  prices: AmountsByCurrency;
  pricesByModel: Map<string, AmountsByCurrency>;
}

/**
 * Everything a model page needs, derived from the CSV: one entry per kind
 * (in editorial order), each carrying its cases grouped per model and an
 * aggregate price. All computed server-side at build time.
 */
export function getPageSections(page: CataloguePage): PageSection[] {
  const wanted = new Set(page.models);
  const byKind = new Map<string, KindBucket>();

  for (const row of rows()) {
    if (!wanted.has(row.model) || !row.kind) continue;
    let bucket = byKind.get(row.kind);
    if (!bucket) {
      bucket = {
        kind: row.kind,
        cases: [],
        prices: newAmounts(),
        pricesByModel: new Map(),
      };
      byKind.set(row.kind, bucket);
    }
    bucket.cases.push(row);
    let perModel = bucket.pricesByModel.get(row.model);
    if (!perModel) {
      perModel = newAmounts();
      bucket.pricesByModel.set(row.model, perModel);
    }
    for (const code of CURRENCIES) {
      const amount = asAmount(row.prices[code]);
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
      const byModel = new Map<string, CaseRecord[]>(
        page.models.map((model) => [model, []]),
      );
      for (const row of bucket.cases) byModel.get(row.model)?.push(row);
      const byModelPrices: SectionPrice["byModel"] = {};
      for (const [model, perModel] of bucket.pricesByModel) {
        byModelPrices[model] = Object.fromEntries(
          CURRENCIES.map((code) => [code, [...perModel[code]]]),
        ) as Record<Currency, number[]>;
      }
      // Merged kinds (e.g. Clear Case) render as one combined grid with no
      // tabs — the cards' labels show the model names instead of colours.
      const merged = Boolean(page.merged?.includes(bucket.kind));
      return {
        kind: bucket.kind,
        merged,
        models: merged
          ? [{ model: null, cases: sortCases(bucket.cases) }]
          : [...byModel.entries()]
              .filter(([, cases]) => cases.length > 0)
              .map(([model, cases]) => ({ model, cases: sortCases(cases) })),
        // Aggregate across the page's models ("from $X" when they differ)
        // plus the raw per-model amounts, so the heading can switch to an
        // exact price when the reader picks a tab.
        price: {
          byCurrency: Object.fromEntries(
            CURRENCIES.map((code) => [
              code,
              reduceAmounts(bucket.prices[code]),
            ]),
          ) as Record<Currency, PriceSummary | null>,
          byModel: byModelPrices,
        },
      };
    });
}

/** Card artwork: a full case record, or just an image code wrapped as one. */
export type HeroCase = Partial<CaseRecord> & { SKU: string };

// The image shown on a group/model navigation card: the newest case of the
// page's leading kind (override per page with `hero: "<SKU>"` if desired).
// A `hero` can be a catalogue SKU ("MJM23" — inherits that case's
// alt_thumbnail) or any everypreview image code, including a specific
// angle ("MJM23_AV4") — anything that exists as
// cloudfront.everycase.org/everypreview/<code>.avif.
function resolveHero(code: string): HeroCase {
  const match = rows().find((row) => row.SKU === code);
  return match ?? { SKU: code };
}

export function getHeroCase(page: CataloguePage): HeroCase | null {
  if (page.hero) {
    return resolveHero(page.hero);
  }
  const sections = getPageSections(page);
  if (sections.length === 0) return null;
  const cases = sections[0].models.flatMap((entry) => entry.cases);
  return cases.reduce<CaseRecord | null>(
    (best, row) =>
      !best || seasonSortKey(row.season) >= seasonSortKey(best.season)
        ? row
        : best,
    null,
  );
}

export function getGroupHeroCase(group: CatalogueGroup): HeroCase | null {
  // A group can pin its card artwork with `hero` (SKU or image code).
  if (group.hero) {
    return resolveHero(group.hero);
  }
  for (const page of group.pages) {
    const hero = getHeroCase(page);
    if (hero) return hero;
  }
  return null;
}

// The everypreview code a card image resolves to (NavCard/CaseCard do the same).
const heroImageCode = (hero: HeroCase | null): string =>
  (hero?.alt_thumbnail || hero?.SKU || "").trim();

/**
 * The image codes each home-card destination shows first — hero artwork for
 * a group's page grid, the first visible case cards for a top-level page.
 * The home page prefetches these (up to `limit` per destination) so the
 * first click lands on an already-warm grid.
 */
export function getHomePrefetchImageCodes(limit = 10): string[] {
  const codes: string[] = [];
  for (const card of HOME_CARDS) {
    const cardCodes: string[] = [];
    if (card.page !== undefined) {
      const page = card.group
        ? getPage(card.group, card.page)
        : getTopPage(card.page);
      if (!page) continue;
      // The page's grids in DOM order; only the visible (first) tab counts.
      for (const section of getPageSections(page)) {
        for (const row of section.models[0]?.cases ?? []) {
          cardCodes.push(heroImageCode(row));
        }
      }
    } else {
      const group = getGroup(card.group);
      if (!group) continue;
      for (const page of group.pages) {
        cardCodes.push(heroImageCode(getHeroCase(page)));
      }
    }
    codes.push(...cardCodes.filter(Boolean).slice(0, limit));
  }
  return [...new Set(codes)];
}

// Where a case lives in the drill-down: the first page whose model list
// contains the case's model. Used for case-page breadcrumbs. Returns
// { group, page }; group is null for top-level pages (their URL is /<page.slug>).
export function findPageForModel(
  model: string,
): { group: CatalogueGroup | null; page: CataloguePage } | null {
  for (const page of TOP_PAGES) {
    if (page.models.includes(model)) return { group: null, page };
  }
  for (const group of GROUPS) {
    for (const page of group.pages) {
      if (page.models.includes(model)) return { group, page };
    }
  }
  return null;
}
