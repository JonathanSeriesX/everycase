import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Callout } from "nextra/components";
import { useMDXComponents as getMDXComponents } from "../../../mdx-components";
import LightboxComponent from "../../../components/LightboxComponent";
import KeyboardProductDetails from "../../../components/KeyboardProductDetails";
import { getAllCasesFromCSV } from "../../../lib/getCasesFromCSV";
import {
  formatOrderNumber,
  isKeyboardProduct,
  parseRegionCodes,
} from "../../../lib/productRegions";

export const dynamic = "force-static";
export const dynamicParams = false;

const IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const EXTENSION = "?wid=1536&hei=1536&fmt=png-alpha";

let cachedCases;
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
  }
  return cachedCases;
}

function findCaseBySku(sku) {
  return loadCases().find((record) => record.SKU === sku);
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

function OrderNumberCallout({ sku, regions }) {
  const orderNumbers = regions.map((region) => formatOrderNumber(sku, region));

  if (orderNumbers.length === 0) {
    return (
      <Callout type="warning" emoji="👉🏻">
        <strong>{sku}</strong> is the base SKU. Its regional suffix is not
        available in the catalogue yet.
      </Callout>
    );
  }

  if (orderNumbers.length === 1) {
    return (
      <Callout type="info" emoji="👉🏻">
        <strong>{orderNumbers[0]}</strong> is the order number for this product,
        used for search engines, auction websites and such.
      </Callout>
    );
  }

  return (
    <Callout type="info" emoji="👉🏻">
      This product was sold under the order numbers{" "}
      {orderNumbers.map((orderNumber, index) => (
        <span key={orderNumber}>
          {index > 0 && ", "}
          <strong>{orderNumber}</strong>
        </span>
      ))}
      .
    </Callout>
  );
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

export async function generateMetadata({ params }) {
  const { sku } = await params;
  const data = findCaseBySku(sku);

  if (!data) return {};

  const caseName = getCaseName(data);
  const title = caseName;
  const images = listVariantsForSku(sku).map((variant) =>
    resolveImageSource(variant),
  );

  return {
    title,
    openGraph: {
      title: `${caseName} — Finest Woven`,
      images: images.map((src) => ({ url: src, alt: caseName })),
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
        {!isKeyboard && <OrderNumberCallout sku={sku} regions={regions} />}
      </header>
      {isKeyboard ? (
        <KeyboardProductDetails
          sku={sku}
          regionOptions={keyboardRegionOptions}
          fallbackImages={defaultImages}
          galleryHeading={galleryHeading}
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
