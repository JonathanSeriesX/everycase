import { Tabs } from "nextra/components";
import VerticalCarousel from "./VerticalCarousel";

const sanitize = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

// Produces a deterministic cache key for a tab's query tuple.
const buildQueryKey = (query, index) =>
  `${["model", "material", "season"]
    .map((field) =>
      query[field]
        ? query[field].toLowerCase().replace(/\s+/g, "-")
        : `any-${field}`,
    )
    .join(".")}:${index}`;

// Strips unusable tab entries and normalizes query + labels.
const normalizeTabs = (tabs = []) => {
  if (!Array.isArray(tabs)) return [];
  return tabs
    .map((tab, index) => {
      if (!tab || typeof tab !== "object") return null;
      const query = {
        model: sanitize(tab.model),
        material: sanitize(tab.material),
        season: sanitize(tab.season),
      };

      const rawLabel = sanitize(tab.label);
      const keyFromLabel = rawLabel
        ? rawLabel.toLowerCase().replace(/\s+/g, "-")
        : null;

      const key =
        sanitize(tab.id) ||
        sanitize(tab.key) ||
        keyFromLabel ||
        buildQueryKey(query, index);

      return {
        key,
        label: rawLabel,
        query,
      };
    })
    .filter(Boolean);
};

// Detects a shared prefix (e.g., "iPhone 15 ") so later labels can be shorter.
const getSharedModelPrefix = (tabs) => {
  const models = tabs.map((tab) => tab.query.model).filter(Boolean);
  const [firstModel] = models;
  if (
    models.length <= 1 ||
    typeof firstModel !== "string" ||
    !firstModel.includes(" ")
  ) {
    return "";
  }
  const candidate = `${firstModel.split(" ")[0]} `;
  const appliesToAll = tabs.every((tab, index) => {
    if (index === 0) return true;
    const { model } = tab.query;
    return model ? model.startsWith(candidate) : false;
  });
  return appliesToAll ? candidate : "";
};

// Generates human readable tab labels with multiple fallback levels.
const resolveLabels = (tabs, tabNames) => {
  const prefix = getSharedModelPrefix(tabs);
  return tabs.map((tab, index) => {
    if (tab.label) return tab.label;

    if (
      Array.isArray(tabNames) &&
      tabNames.length === tabs.length &&
      tabNames[index]
    ) {
      return tabNames[index];
    }

    const { model, material, season } = tab.query;
    if (model) {
      if (!prefix || index === 0) return model;
      return model.startsWith(prefix) ? model.slice(prefix.length) : model;
    }

    return material || season || `Tab ${index + 1}`;
  });
};

// Persists active tab per unique query combo so content toggles survive reloads.
const buildStorageKey = (tabs) => {
  const queryKey = tabs
    .map(({ query }) =>
      ["model", "material", "season"]
        .map((field) =>
          query[field]
            ? query[field].replace(/\s+/g, "-").toLowerCase()
            : `any-${field}`,
        )
        .join("."),
    )
    .join("|");
  return `case-table-tabs:${queryKey}`;
};

/**
 * Displays a tabbed view of case variants with per-tab queries.
 *
 * @param {Object} props
 * @param {Array<{
 *   label?: string,
 *   model?: string,
 *   material?: string,
 *   season?: string,
 * }>} props.tabs - Ordered list of tab definitions.
 * @param {string[]} [props.tabNames] - Optional labels for the tabs. Must match the length of `tabs`.
 */
const CaseTableTabs = ({ tabs = [], tabNames = [] }) => {
  const normalizedTabs = normalizeTabs(tabs);

  if (normalizedTabs.length === 0) {
    return null;
  }

  if (normalizedTabs.length === 1) {
    const [singleTab] = normalizedTabs;
    return <VerticalCarousel {...singleTab.query} />;
  }

  const resolvedLabels = resolveLabels(normalizedTabs, tabNames);
  const storageKey = buildStorageKey(normalizedTabs);

  return (
    <Tabs items={resolvedLabels} storageKey={storageKey}>
      {normalizedTabs.map((tab, index) => (
        <Tabs.Tab key={`${tab.key}-${index}`}>
          <VerticalCarousel {...tab.query} />
        </Tabs.Tab>
      ))}
    </Tabs>
  );
};

export default CaseTableTabs;
