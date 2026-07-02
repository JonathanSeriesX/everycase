import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import LightboxComponent from "../../../components/LightboxComponent";
import Breadcrumb from "../../../components/Breadcrumb";
import { findPageForModel } from "../../../lib/catalogue";
import KeyboardProductDetails from "../../../components/KeyboardProductDetails";
import CaseInfoCards from "../../../components/CaseInfoCards";
import { getAllCasesFromCSV } from "../../../lib/getCasesFromCSV.mjs";
import { getCompatibleModels } from "../../../lib/getCompatibleModels.mjs";
import { getSimilarSkus } from "../../../lib/similarCases.mjs";
import { getReleaseDate } from "../../../lib/releaseDates";
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

let cachedCases;
let cachedCasesBySku;
let cachedVariantFilenames;

function loadCases() {
  if (!cachedCases) {
    cachedCases = getAllCasesFromCSV().map((record) => ({
      ...record,
      SKU: (record.SKU || "").trim(),
      colour: (record.colour || "").trim(),
      kind: (record.kind || "").trim(),
      model: (record.model || "").trim(),
      name: (record.name || "").trim(),
      season: (record.season || "").trim(),
      alt_thumbnail: (record.alt_thumbnail || "").trim(),
      regions: (record.regions || "").trim(),
    }));
    cachedCasesBySku = new Map(
      cachedCases.map((record) => [record.SKU, record]),
    );
  }
  return cachedCases;
}

function findCaseBySku(sku) {
  loadCases();
  return cachedCasesBySku.get(sku);
}

function loadVariantFilenames() {
  if (cachedVariantFilenames) return cachedVariantFilenames;

  const filePath = path.join(process.cwd(), "scripts", "source_images.txt");
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

function listVariantsForSku(sku) {
  const variantLines = loadVariantFilenames();
  const variants = variantLines.filter(
    (line) => line === sku || line.startsWith(`${sku}_`),
  );
  return variants.length > 0 ? variants : [sku];
}

function listVariantsForRegion(sku, region) {
  const prefix = `${sku}${region}`;
  return loadVariantFilenames().filter(
    (line) => line === prefix || line.startsWith(`${prefix}_`),
  );
}

function resolveImageSource(variant) {
  const code = (variant || "").trim();
  return `${IMAGE_BASE_URL}/${code}${EXTENSION}`;
}

function resolveOgImageSource(variant) {
  const code = (variant || "").trim();
  return `${IMAGE_BASE_URL}/${code}${OG_IMAGE_EXTENSION}`;
}

function getCaseName(data) {
  const explicitName = (data.name || "").trim();
  if (explicitName) return explicitName;

  const modelMatch = data.model.match(/iPhone\s+(\d+)/i);
  const isMagSafeModel = modelMatch && parseInt(modelMatch[1], 10) >= 12;
  const colourPart =
    data.colour && data.colour !== "Clear Case" ? ` — ${data.colour}` : "";
  const magSafePart = isMagSafeModel ? " with MagSafe" : "";
  return `${data.model} ${data.kind}${magSafePart}${colourPart}`.trim();
}

function buildImages(variants, caseName) {
  return variants.map((variant) => ({
    src: resolveImageSource(variant),
    alt: caseName,
  }));
}

// Gather everything the info cards need: copyable order numbers, the release
// date (and a re-release date when the case came back under an alt SKU),
// regional MSRP and, for keyboards, the US education price when it differs
// from the US MSRP.
function buildCaseInfo(data, regions) {
  const sku = data.SKU;
  const altSku = (data.alt_sku || "").trim();
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

  const msrp = (data.MSRP || "").trim();
  const eduPriceRaw = (data.edu_price || "").trim();
  const eduDiffers = eduPriceRaw && Number(eduPriceRaw) !== Number(msrp || NaN);
  loadCases();
  const similarCases = getSimilarSkus(sku)
    .map((similarSku) => cachedCasesBySku.get(similarSku))
    .filter(Boolean)
    .map((record) => ({
      SKU: record.SKU,
      name: getCaseName(record),
    }));

  return {
    skuGroups,
    compatibleModels: getCompatibleModels(data.model),
    similarCases,
    releaseSku: altSku ? sku : "",
    reReleaseSku: altSku,
    releaseDate: getReleaseDate(sku),
    reReleaseDate: altSku ? getReleaseDate(altSku) : "",
    msrp: [
      formatPrice(msrp, "USD"),
      formatPrice(data.MSRP_EUR, "EUR"),
      formatPrice(data.MSRP_GBP, "GBP"),
    ].filter(Boolean),
    eduPrice: eduDiffers ? formatPrice(eduPriceRaw) : "",
  };
}

export async function generateStaticParams() {
  const seen = new Set();
  const params = [];

  for (const record of loadCases()) {
    const sku = record.SKU;
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);
    params.push({ sku });
  }

  return params;
}

export async function generateMetadata({ params }, parent) {
  const { sku } = await params;
  const data = findCaseBySku(sku);

  if (!data) return {};

  const caseName = getCaseName(data);
  const title = caseName;
  const firstVariant = listVariantsForSku(sku)[0];
  const image = resolveOgImageSource(firstVariant);
  const parentMetadata = await parent;

  return {
    title,
    openGraph: {
      title,
      siteName: parentMetadata.openGraph?.siteName,
      locale: parentMetadata.openGraph?.locale,
      type: parentMetadata.openGraph?.type,
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

export default async function CasePage({ params }) {
  const { sku } = await params;
  const data = findCaseBySku(sku);

  if (!data) return notFound();

  const caseName = getCaseName(data);
  const regions = parseRegionCodes(data.regions);
  const isKeyboard = isKeyboardProduct(data.kind);
  const info = buildCaseInfo(data, regions);
  const defaultImages = buildImages(listVariantsForSku(sku), caseName);
  const keyboardRegionOptions = isKeyboard
    ? regions.map((region) => {
        const regionalVariants = listVariantsForRegion(sku, region);
        const useRegionalImages =
          region !== "LL" && regionalVariants.length > 0;
        return {
          region,
          images: useRegionalImages
            ? buildImages(regionalVariants, caseName)
            : defaultImages,
        };
      })
    : [];
  const home = findPageForModel(data.model);

  return (
    <article data-pagefind-body>
      <Breadcrumb
        trail={[
          ...(home
            ? [
                ...(home.page.topLevel
                  ? []
                  : [{ href: `/${home.group.slug}`, title: home.group.title }]),
                {
                  href: `/${home.group.slug}/${home.page.slug}`,
                  title: home.page.title,
                },
              ]
            : []),
          { href: `/case/${sku}`, title: sku },
        ]}
      />
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
