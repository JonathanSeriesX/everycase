import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Callout } from 'nextra/components';
import LightboxComponent from '../../../components/LightboxComponent';
import { getAllCasesFromCSV } from '../../../lib/getCasesFromCSV';

export const dynamic = 'force-dynamic';

function getCaseName(data) {
  const match = data.model && data.model.match(/iPhone\s+(\d+)/i);
  const isMagSafeModel = match && parseInt(match[1], 10) >= 12;
  const colourPart = data.colour !== 'Clear Case' ? ` — ${data.colour}` : '';
  const magSafePart = isMagSafeModel ? ' with MagSafe' : '';
  return `${data.model} ${data.kind}${magSafePart}${colourPart}`.trim();
}

export async function generateMetadata({ params }) {
  const { sku } = params;
  const records = getAllCasesFromCSV();
  const data = records.find((r) => (r.SKU || '').trim() === sku);
  if (!data) return {};
  const title = `${getCaseName(data)} — Finest Woven`;
  return { title };
}

export default function CasePage({ params }) {
  const { sku } = params;
  const records = getAllCasesFromCSV();
  const data = records.find((r) => (r.SKU || '').trim() === sku);
  if (!data) return notFound();

  const caseName = getCaseName(data);

  // Read list of available image variants for this SKU from scripts/filenames.txt
  const filePath = path.join(process.cwd(), 'scripts', 'filenames.txt');
  let matchingModels = [];
  try {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    matchingModels = fileContents
      .split('\n')
      .filter((line) => line.startsWith(sku))
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (e) {
    // If the list is missing, default to the base SKU only
    matchingModels = [sku];
  }

  const images = matchingModels.map((variant) => ({
    src: `https://cloudfront.everycase.org/everysource/${variant}.webp`,
    alt: caseName,
  }));

  return (
    <main>
      <h1>{caseName}</h1>
      <Callout type="info" emoji="👉🏻">
        <strong>{sku}ZM</strong> is an order number for this product, used for search engines, auction websites and such.
      </Callout>
      <div style={{ marginTop: '1rem' }}>
        <LightboxComponent images={images} />
      </div>
    </main>
  );
}
