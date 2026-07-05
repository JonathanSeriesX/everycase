import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import LightboxComponent, {
  type GalleryImage,
} from "../../../components/LightboxComponent";
import Breadcrumb, { type Crumb } from "../../../components/Breadcrumb";
import { findPageForModel } from "../../../lib/catalogue";
import KeyboardProductDetails, {
  type KeyboardRegionOption,
} from "../../../components/KeyboardProductDetails";
import CaseInfoCards, {
  type CaseInfo,
} from "../../../components/CaseInfoCards";
import {
  getAllCasesFromCSV,
  type CaseRecord,
} from "../../../lib/getCasesFromCSV";
import { getCompatibleModels } from "../../../lib/getCompatibleModels";
import { getSimilarSkus } from "../../../lib/similarCases";
import { getReleaseDate } from "../../../lib/releaseDates";
import { getCaseName } from "../../../lib/caseName";
import {
  formatOrderNumber,
  formatPrice,
  isKeyboardProduct,
  parseRegionCodes,
} from "../../../lib/productRegions";

export const dynamic = "force-static";
export const dynamicParams = false;

const IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const EXTENSION = "?wid=1536&hei=1536&fmt=png-alpha";
const OG_IMAGE_EXTENSION = "?wid=1200&hei=630&fmt=jpg&qlt=99";

let cachedCasesBySku: Map<string, CaseRecord> | undefined;
let cachedVariantFilenames: string[] | undefined;

// Records come pre-trimmed from getCasesFromCSV; on SKU collisions the last
// row wins, matching the original Map construction.
function findCaseBySku(sku: string): CaseRecord | undefined {
  cachedCasesBySku ??= new Map(
    getAllCasesFromCSV().map((record) => [record.SKU, record]),
  );
  return cachedCasesBySku.get(sku);
}

function loadVariantFilenames(): string[] {
  if (cachedVariantFilenames) return cachedVariantFilenames;

  const filePath = path.join(process.cwd(), "database", "source_images.txt");
  try {
    const fileContents = fs.readFileSync(filePath, "utf-8");
    cachedVariantFilenames = fileContents
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    cachedVariantFilenames = [];
  }

  return cachedVariantFilenames;
}

function listVariantsForSku(sku: string): string[] {
  const variants = loadVariantFilenames().filter(
    (line) => line === sku || line.startsWith(`${sku}_`),
  );
  return variants.length > 0 ? variants : [sku];
}

function listVariantsForRegion(sku: string, region: string): string[] {
  const prefix = `${sku}${region}`;
  return loadVariantFilenames().filter(
    (line) => line === prefix || line.startsWith(`${prefix}_`),
  );
}

// Regional keyboard galleries are the base gallery with regional shots
// swapped in per view: MJQJ3LA_AV1 replaces MJQJ3_AV1, while views that were
// never reshot regionally (MJQJ3, MJQJ3_AV2, …) keep the base image. Regional
// views with no base counterpart are kept, appended after the base order.
function listMergedVariantsForRegion(sku: string, region: string): string[] {
  const base = listVariantsForSku(sku);
  const regional = listVariantsForRegion(sku, region);
  if (regional.length === 0) return base;

  const prefix = `${sku}${region}`;
  const regionalByView = new Map(
    regional.map((variant) => [variant.slice(prefix.length), variant]),
  );
  const merged = base.map((variant) => {
    const view = variant.slice(sku.length);
    const replacement = regionalByView.get(view);
    if (replacement) regionalByView.delete(view);
    return replacement ?? variant;
  });
  merged.push(...regionalByView.values());
  return merged;
}

function buildImages(variants: string[], caseName: string): GalleryImage[] {
  return variants.map((variant) => ({
    src: `${IMAGE_BASE_URL}/${variant.trim()}${EXTENSION}`,
    alt: caseName,
  }));
}

// Gather everything the info cards need: copyable order numbers, the release
// date (and a re-release date when the case came back under an alt SKU),
// regional MSRP and, for keyboards, the US education price when it differs
// from the US MSRP.
function buildCaseInfo(data: CaseRecord, regions: string[]): CaseInfo {
  const sku = data.SKU;
  const altSku = data.alt_sku;
  // No regional suffix on record → fall back to the bare SKU as the order number.
  const orderRegions = regions.length > 0 ? regions : [""];

  const allOrderNumbers = orderRegions.map((region) =>
    formatOrderNumber(sku, region),
  );
  if (altSku) {
    allOrderNumbers.push(
      ...orderRegions.map((region) => formatOrderNumber(altSku, region)),
    );
  }

  const skuGroups = [
    {
      label: null,
      orderNumbers: allOrderNumbers,
    },
  ];

  const msrp = data.MSRP;
  const eduPriceRaw = data.edu_price;
  const eduDiffers = eduPriceRaw && Number(eduPriceRaw) !== Number(msrp || NaN);
  const similarCases = getSimilarSkus(sku)
    .map((similarSku) => findCaseBySku(similarSku))
    .filter((record): record is CaseRecord => Boolean(record))
    .map((record) => ({
      SKU: record.SKU,
      name: getCaseName(record),
    }));

  return {
    collectionSku: sku,
    skuGroups,
    compatibleModels: getCompatibleModels(data.model),
    similarCases,
    releaseSku: altSku ? sku : "",
    reReleaseSku: altSku,
    releaseDate: getReleaseDate(sku),
    reReleaseDate: altSku ? getReleaseDate(altSku) : "",
    msrp: data.prices,
    eduPrice: eduDiffers ? formatPrice(eduPriceRaw) : "",
  };
}

interface CaseRouteProps {
  params: Promise<{ sku: string }>;
}

export async function generateStaticParams() {
  const seen = new Set<string>();
  const params: { sku: string }[] = [];

  for (const record of getAllCasesFromCSV()) {
    const sku = record.SKU;
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);
    params.push({ sku });
  }

  return params;
}

export async function generateMetadata(
  { params }: CaseRouteProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { sku } = await params;
  const data = findCaseBySku(sku);

  if (!data) return {};

  const caseName = getCaseName(data);
  const title = caseName;
  const firstVariant = listVariantsForSku(sku)[0];
  const image = `${IMAGE_BASE_URL}/${firstVariant.trim()}${OG_IMAGE_EXTENSION}`;
  const parentMetadata = await parent;

  return {
    title,
    openGraph: {
      title,
      siteName: parentMetadata.openGraph?.siteName,
      locale: parentMetadata.openGraph?.locale,
      // The root layout's OG type, which case pages inherit.
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: caseName,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      creator: parentMetadata.twitter?.creator,
      images: [image],
    },
  };
}

export default async function CasePage({ params }: CaseRouteProps) {
  const { sku } = await params;
  const data = findCaseBySku(sku);

  if (!data) return notFound();

  const caseName = getCaseName(data);
  const regions = parseRegionCodes(data.regions);
  const isKeyboard = isKeyboardProduct(data.kind);
  const info = buildCaseInfo(data, regions);
  const defaultImages = buildImages(listVariantsForSku(sku), caseName);
  const keyboardRegionOptions: KeyboardRegionOption[] = isKeyboard
    ? regions.map((region) => ({
        region,
        images: buildImages(listMergedVariantsForRegion(sku, region), caseName),
      }))
    : [];
  const home = findPageForModel(data.model);

  const trail: Crumb[] = [];
  if (home) {
    if (home.group) {
      trail.push({ href: `/${home.group.slug}`, title: home.group.title });
    }
    trail.push({
      href: home.group
        ? `/${home.group.slug}/${home.page.slug}`
        : `/${home.page.slug}`,
      title: home.page.title,
    });
  }
  trail.push({ href: `/case/${sku}`, title: sku });

  return (
    <article data-pagefind-body>
      <Breadcrumb trail={trail} />
      <header>
        <h1 data-pagefind-ignore data-pagefind-meta="title">
          {caseName}
        </h1>
        {!isKeyboard && <CaseInfoCards {...info} />}
      </header>
      {isKeyboard ? (
        <KeyboardProductDetails
          sku={sku}
          regionOptions={keyboardRegionOptions}
          fallbackImages={defaultImages}
          info={info}
        />
      ) : (
        <section>
          <h2 id="image-gallery" data-pagefind-ignore>Image gallery</h2>
          <LightboxComponent images={defaultImages} />
        </section>
      )}
    </article>
  );
}
