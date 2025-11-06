import { Tabs } from "nextra/components";
import VerticalCarousel from "./VerticalCarousel";

/**
 * Displays a tabbed view of case variants for a list of models.
 *
 * @param {Object} props
 * @param {string[]} props.models - Ordered list of device models to render tabs for.
 * @param {string} [props.material] - Optional material filter passed to the carousel.
 * @param {string[]} [props.tabNames] - Optional labels for the tabs. Must match the length of `models`.
 */
const CaseTableTabs = ({ models = [], material, tabNames }) => {
  const normalizedModels = Array.isArray(models)
    ? models.filter(Boolean)
    : [];

  if (normalizedModels.length === 0) {
    return null;
  }

  if (normalizedModels.length === 1) {
    const [onlyModel] = normalizedModels;
    return (
      <VerticalCarousel
        {...(onlyModel ? { model: onlyModel } : {})}
        {...(material ? { material } : {})}
      />
    );
  }

  const [firstModel] = normalizedModels;
  const prefix =
    typeof firstModel === "string" && firstModel.includes(" ")
      ? `${firstModel.split(" ")[0]} `
      : "";

  const defaultTabNames = normalizedModels.map((model, index) => {
    if (index === 0 || !prefix) return model;
    return model.startsWith(prefix) ? model.slice(prefix.length) : model;
  });

  const storageKey =
    normalizedModels.length === 0
      ? undefined
      : [
          "case-table-tabs",
          material ? material.replace(/\s+/g, "-").toLowerCase() : "all",
          normalizedModels
            .map((model, idx) =>
              typeof model === "string"
                ? model.replace(/\s+/g, "-").toLowerCase()
                : `index-${idx}`,
            )
            .join("|"),
        ].join(":");

  const labels =
    Array.isArray(tabNames) && tabNames.length === normalizedModels.length
      ? tabNames
      : defaultTabNames;

  return (
    <Tabs items={labels} {...(storageKey ? { storageKey } : {})}>
      {normalizedModels.map((model, index) => (
        <Tabs.Tab key={model ?? index}>
          <VerticalCarousel
            {...(model ? { model } : {})}
            {...(material ? { material } : {})}
          />
        </Tabs.Tab>
      ))}
    </Tabs>
  );
};

export default CaseTableTabs;
