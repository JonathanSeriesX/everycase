import { filterCases, getAllCasesFromCSV } from "./getCasesFromCSV";

let cachedCatalog = null;

function loadCatalog() {
  if (!cachedCatalog) {
    cachedCatalog = getAllCasesFromCSV();
  }
  return cachedCatalog;
}

export function getCasesForCollection({ model = null, material = null, season = null } = {}) {
  const catalog = loadCatalog();
  return filterCases(catalog, { model, material, season });
}

export function getAllCatalogCases() {
  return loadCatalog();
}
