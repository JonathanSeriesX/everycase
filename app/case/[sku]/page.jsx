import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Callout } from "nextra/components";
import { Cards } from "nextra/components";
import { useMDXComponents as getMDXComponents } from "../../../mdx-components";
import LightboxComponent from "../../../components/LightboxComponent";
import { getAllCasesFromCSV } from "../../../lib/getCasesFromCSV";

export const dynamic = "force-static";
export const dynamicParams = false;

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
  } catch (error) {
    cachedVariantFilenames = [];
  }

  return cachedVariantFilenames;
}

function listVariantsForSku(sku) {
  const variantLines = loadVariantFilenames();
  const variants = variantLines.filter((line) => line.startsWith(sku));
  return variants.length > 0 ? variants : [sku];
}

function resolveImageSource(variant) {
  const hasExtension = /\.[a-z0-9]+$/i.test(variant);
  const isGalleryShot = variant.includes("_AV");
  const baseUrl = isGalleryShot
    ? "https://cloudfront.everycase.org/everyimage/"
    : "https://cloudfront.everycase.org/everysource/";
  const extension = isGalleryShot ? "avif" : "webp";

  return `${baseUrl}${variant}${hasExtension ? "" : `.${extension}`}`;
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
    resolveImageSource(variant)
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
  const orderNumber = `${sku}ZM/A`;
  const images = listVariantsForSku(sku).map((variant) => ({
    src: resolveImageSource(variant),
    alt: caseName,
  }));
  const metadata = {
    title: caseName,
  };

  return (
    <Wrapper toc={[]} metadata={metadata}>
      <div className="nx-space-y-6">
        <header className="nx-space-y-2">
          <Heading1>{caseName}</Heading1>
          <Callout type="info" emoji="👉🏻">
            <strong>{orderNumber}</strong> is an order number for this product,
            used for search engines, auction websites and such.
          </Callout>
        </header>
        <section className="nx-space-y-2">
          <Heading2>Image gallery</Heading2>
          <LightboxComponent images={images} />
        </section>
      </div>
    </Wrapper>
  );
}
