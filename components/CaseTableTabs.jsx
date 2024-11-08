import { Tabs } from "nextra/components";
import CaseTable from "./CaseTable"; // Assuming CaseTable is in the same directory

const CaseTableTabs = ({ series, season, material }) => {
  let models;
  switch (series) {
    case "iPhone 15":
      models = ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"];
      break;
    case "iPhone 14":
      models = ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"];
      break;
  }

  let names = models.map((model, index) => {
    return index === 0 ? model : model.replace("iPhone ", "");
  });

  return (
    <Tabs items={names}>
      {models.map((model, index) => (
        <Tabs.Tab key={index} title={model}>
          <CaseTable model={model} season={season} material={material} />
        </Tabs.Tab>
      ))}
    </Tabs>
  );
};

export default CaseTableTabs;