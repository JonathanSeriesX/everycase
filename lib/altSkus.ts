import { getAllCasesFromCSV } from "./getCasesFromCSV";

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

// Some cases were re-released later under a fresh SKU (recorded as `alt_sku`).
// The primary SKU owns the case page; the re-release SKU should redirect to it
// so links like /case/MXRK3 land on /case/MT203.
export function getAltSkuRedirects(): Redirect[] {
  const redirects: Redirect[] = [];
  const seen = new Set<string>();

  for (const record of getAllCasesFromCSV()) {
    const { SKU: sku, alt_sku: altSku } = record;
    if (!sku || !altSku || altSku === sku || seen.has(altSku)) continue;
    seen.add(altSku);
    redirects.push({
      source: `/case/${altSku}`,
      destination: `/case/${sku}`,
      permanent: true,
    });
  }

  return redirects;
}
