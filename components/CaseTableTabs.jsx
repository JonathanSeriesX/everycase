import { Tabs } from "nextra/components";
import CaseTable from "./CaseTable"; // can't refer explicitly?
import VerticalCarousel from "components/VerticalCarousel"; // can't refer explicitly?

const CaseTableTabs = ({ series, season, material, tabNames }) => {
  let models;
  let displayName;
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

  let names = models.map((model, index) => {
    return index === 0 ? model : model.replace("iPhone ", "");
  });

  const tabs = tabNames || models;

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