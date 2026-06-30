import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { useMDXComponents as getMDXComponents } from "../../../mdx-components";
import LightboxComponent from "../../../components/LightboxComponent";
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

// Maps a case to its sidebar folder so we can keep that folder open even though
// case pages live outside the content tree. The three folders are iphone / ipad
// / others; AirTag, Mac, iPod, Pencil and MagSafe wallets all live under others.
function getCategoryRoute(model) {
  if (/^iPhone\b/i.test(model)) return "/iphone";
  if (/^iPad\b/i.test(model)) return "/ipad";
  return "/others";
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
    ]
      .filter(Boolean)
      .join(" | "),
    eduPrice: eduDiffers ? formatPrice(eduPriceRaw) : "",
  };
}

const mdxComponents = getMDXComponents();
const Wrapper = mdxComponents.wrapper;
const Heading1 = mdxComponents.h1 ?? ((props) => <h1 {...props} />);
const Heading2 = mdxComponents.h2 ?? ((props) => <h2 {...props} />);

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
  const metadata = {
    title: caseName,
  };

  const galleryHeading = <Heading2 id="image-gallery">Image gallery</Heading2>;

  return (
    <Wrapper
      toc={[{ depth: 2, value: "Image gallery", id: "image-gallery" }]}
      metadata={metadata}
    >
      <header>
        <Heading1>{caseName}</Heading1>
        {!isKeyboard && <CaseInfoCards {...info} />}
      </header>
      {isKeyboard ? (
        <KeyboardProductDetails
          sku={sku}
          regionOptions={keyboardRegionOptions}
          fallbackImages={defaultImages}
          galleryHeading={galleryHeading}
          info={info}
        />
      ) : (
        <section>
          {galleryHeading}
          <LightboxComponent images={defaultImages} />
        </section>
      )}
    </Wrapper>
  );
}
