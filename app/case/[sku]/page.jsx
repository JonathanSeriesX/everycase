import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Callout } from 'nextra/components';
import LightboxComponent from '../../../components/LightboxComponent';
import { getAllCasesFromCSV } from '../../../lib/getCasesFromCSV';

export const dynamic = 'force-static';
export const dynamicParams = false;

let cachedCases;
let cachedVariantFilenames;

function loadCases() {
  if (!cachedCases) {
    cachedCases = getAllCasesFromCSV().map((record) => ({
      ...record,
      SKU: (record.SKU || '').trim(),
      colour: (record.colour || '').trim(),
      kind: (record.kind || '').trim(),
      model: (record.model || '').trim(),
    }));
  }
  return cachedCases;
}

function findCaseBySku(sku) {
  return loadCases().find((record) => record.SKU === sku);
}

function loadVariantFilenames() {
  if (cachedVariantFilenames) return cachedVariantFilenames;

  const filePath = path.join(process.cwd(), 'scripts', 'filenames.txt');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    cachedVariantFilenames = fileContents
      .split('\n')
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
  const isGalleryShot = variant.includes('_AV');
  const baseUrl = isGalleryShot
    ? 'https://cloudfront.everycase.org/everyimage/'
    : 'https://cloudfront.everycase.org/everysource/';
  const extension = isGalleryShot ? 'avif' : 'webp';

  return `${baseUrl}${variant}${hasExtension ? '' : `.${extension}`}`;
}

function getCaseName(data) {
  const modelMatch = data.model.match(/iPhone\s+(\d+)/i);
  const isMagSafeModel = modelMatch && parseInt(modelMatch[1], 10) >= 12;
  const colourPart = data.colour && data.colour !== 'Clear Case' ? ` — ${data.colour}` : '';
  const magSafePart = isMagSafeModel ? ' with MagSafe' : '';
  return `${data.model} ${data.kind}${magSafePart}${colourPart}`.trim();
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

export async function generateMetadata({ params }) {
  const { sku } = await params;
  const data = findCaseBySku(sku);

  if (!data) return {};

  const caseName = getCaseName(data);
  const title = `${caseName} — Finest Woven`;
  const images = listVariantsForSku(sku).map((variant) => resolveImageSource(variant));

  return {
    title,
    openGraph: {
      title,
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

  return (
    <main>
      <h1 className="_mt-2 _text-4xl _font-bold _tracking-tight _text-slate-900 dark:_text-slate-100">
        {caseName}
      </h1>
      <Callout type="info" emoji="👉🏻">
        <strong>{orderNumber}</strong> is an order number for this product, used for search engines, auction websites
        and such.
      </Callout>
      <h2 className="_mt-6 _text-2xl _font-semibold _tracking-tight _text-slate-900 dark:_text-slate-100">
        Image gallery
      </h2>
      <div className="_mt-4">
        <LightboxComponent images={images} />
      </div>
    </main>
  );
}
