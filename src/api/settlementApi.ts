import { defaultSettlementData } from "src/defaultData";
import WorldBuildingPlugin from "src/main";
import { generateGaussianValue } from "src/util";

export class SettlementType {
  type: string;
  description: string;
  distributionType: string;
  minPopulation: number;
  maxPopulation: number;
}

export class Settlement {
  type: string;
  name: string;
  population: number;
}

export class SettlementAPI {
  plugin: WorldBuildingPlugin;
  data: SettlementType[];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.data = [];
  }

  private loadDefaultData() {
    this.data = JSON.parse(JSON.stringify(defaultSettlementData));
  }

  public saveDefaultData() {
    const fullPath = this.plugin.settings.dataDirectory + "/default_settlement_data.csv";
    this.plugin.csvManager.writeFile(fullPath, defaultSettlementData);
  }

  reloadData() {
    if (this.plugin.settings.settlementData !== "") {
      this.data = [];
      const dataPath = this.plugin.settings.dataDirectory + "/" + this.plugin.settings.settlementData;
      const data = this.plugin.csvManager.getDataByFile(dataPath);
      if (data === undefined) {
        console.error("Could not load settlement data.");
        this.loadDefaultData();
        return;
      }
      console.log("Loading settlement data from " + this.plugin.settings.settlementData + ".");
      for (let i = 1; i < data.length; i++) {
        const settlement = new SettlementType();
        settlement.type = data[i][0];
        settlement.description = data[i][1];
        settlement.distributionType = data[i][2];
        settlement.minPopulation = Number(data[i][3]);
        settlement.maxPopulation = Number(data[i][4]);
        this.data.push(settlement);
      }
    } else {
      this.loadDefaultData();
    }
  }

  getRawData(): SettlementType[] {
    return this.data;
  }

  findSettlementDataByType(type: string): SettlementType | undefined {
    return this.data.find((settlement) => settlement.type === type);
  }

  generateSettlement(type: string): Settlement | undefined {
    const settlementData = this.findSettlementDataByType(type);
    if (settlementData === undefined) {
      console.error("Could not find settlement data for type: " + type);
      return undefined;
    }
    const settlement = new Settlement();
    settlement.type = settlementData.type;
    //settlement.name = this.generateName(settlementData);
    settlement.population = this.generatePopulation(settlementData);
    return settlement;
  }

  private generatePopulation(settlementData: SettlementType): number {
    switch (settlementData.distributionType) {
      case "gaussian":
        return generateGaussianValue(settlementData.minPopulation, settlementData.maxPopulation, 1.0);
      default:
        return NaN;
    }
  }
}
