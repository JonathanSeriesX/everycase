import { Tabs } from "nextra/components";
import VerticalCarousel from "./VerticalCarousel";

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
  const sanitize = (value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  };

  const normalizedTabs = Array.isArray(tabs)
    ? tabs
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

          const fallbackKeyParts = ["model", "material", "season"]
            .map((field) =>
              query[field]
                ? query[field].toLowerCase().replace(/\s+/g, "-")
                : `any-${field}`,
            )
            .join(".");

          const key =
            sanitize(tab.id) ||
            sanitize(tab.key) ||
            keyFromLabel ||
            `${fallbackKeyParts}:${index}`;

          return {
            key,
            label: rawLabel,
            query,
          };
        })
        .filter(Boolean)
    : [];

  if (normalizedTabs.length === 0) {
    return null;
  }

  if (normalizedTabs.length === 1) {
    const [singleTab] = normalizedTabs;
    return <VerticalCarousel {...singleTab.query} />;
  }

  const allModels = normalizedTabs
    .map((tab) => tab.query.model)
    .filter(Boolean);
  const firstModel = allModels[0];
  const prefix =
    allModels.length > 1 &&
    typeof firstModel === "string" &&
    firstModel.includes(" ")
      ? (() => {
          const candidate = `${firstModel.split(" ")[0]} `;
          const appliesToAll = normalizedTabs.every((tab, index) => {
            if (index === 0) return true;
            const { model } = tab.query;
            return model ? model.startsWith(candidate) : false;
          });
          return appliesToAll ? candidate : "";
        })()
      : "";

  const resolvedLabels = normalizedTabs.map((tab, index) => {
    if (tab.label) return tab.label;

    if (
      Array.isArray(tabNames) &&
      tabNames.length === normalizedTabs.length &&
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

  const storageKey = [
    "case-table-tabs",
    normalizedTabs
      .map(({ query }) =>
        ["model", "material", "season"]
          .map((field) =>
            query[field]
              ? query[field].replace(/\s+/g, "-").toLowerCase()
              : `any-${field}`,
          )
          .join("."),
      )
      .join("|"),
  ].join(":");

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
