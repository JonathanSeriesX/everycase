import { getAllCasesFromCSV } from "./getCasesFromCSV.js";

// Some cases were re-released later under a fresh SKU (recorded as `alt_sku`).
// The primary SKU owns the case page; the re-release SKU should redirect to it
// so links like /case/MXRK3 land on /case/MT203.
export function getAltSkuRedirects() {
  const redirects = [];
  const seen = new Set();

  for (const record of getAllCasesFromCSV()) {
    const sku = (record.SKU || "").trim();
    const altSku = (record.alt_sku || "").trim();
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
