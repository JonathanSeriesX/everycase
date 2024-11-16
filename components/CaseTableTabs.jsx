import { Tabs } from "nextra/components";
import VerticalCarousel from "components/VerticalCarousel";


/**
 * CaseTableTabs Component
 *
 * Provides beautifully styled tabs, each containing a vertical carousel of cases for similar models.
 * Supports filtering by season, material, and multiple model series.
 *
 * @param {string} series - The series of devices (e.g., "iPhone 16") to display in tabs.
 * @param {string} season - The season to filter cases (e.g., "Autumn 2020").
 * @param {string} material - The material of the case to filter cases (e.g., "Leather Case").
 * @param {Array<string>} [tabNames] - Custom names for the tabs (optional). Defaults to formatted model names.
 * @returns {JSX.Element} Tabs displaying vertical carousels for filtered cases.
 */
const CaseTableTabs = ({ series, season, material, tabNames }) => {
  // Pre-defined batches to expand series when it's "iPhone 16" 
  let models;
  switch (series) {
    case "iPhone 16":
      models = ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max"];
      break;
    case "iPhone 15":
      models = ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"];
      break;
    case "iPhone 14":
      models = ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"];
      break;
    case "iPhone 13":
      models = ["iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max"];
      break;
    case "iPhone 12":
      models = ["iPhone 12 mini", "iPhone 12 & 12 Pro", "iPhone 12 Pro Max"];
      break;
    case "iPhone 11 Pro":
      models = ["iPhone 11 Pro", "iPhone 11 Pro Max"];
      break;
    case "iPhone Xs":
      models = ["iPhone XS", "iPhone XS Max"];
      break;
    case "iPhone XR":
      models = ["iPhone XR", "iPhone 11"];
      break;
    case "iPad Pro M4":
      models = ["iPad Pro M4 11-inch", "iPad Pro M4 13-inch"];
      break;
  }

  // Format tab names; remove redundant prefixes for all but the first model
  // So we'd have "iPhone 13, 13 Pro, ..." instead of "iPhone 13, iPhone 13 Pro, ..."
  let names = models.map((model, index) => {
    return index === 0 ? model : model.replace("iPhone ", "");
  });

  const tabs = tabNames || names;

  return (
    <Tabs items={tabs}>
      {models.map((model, index) => (
        <Tabs.Tab key={index} title={model}>
          <VerticalCarousel
            {...(model ? { model } : {})}
            {...(season ? { season } : {})}
            {...(material ? { material } : {})}
          />
        </Tabs.Tab>
      ))}
    </Tabs>
  );
};

export default CaseTableTabs;